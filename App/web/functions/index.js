const fs = require("@google-cloud/firestore");

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

// Custom data types:
/**
 * Represents an time in terms of hours and minutes.
 * Is supposed to be immutable.
 */
class Time {
	hours;
	minutes;

	/**
	 * Creates a new Time object with the specified number of hours and minutes.
	 * Only meant for use with non-negative values.
	 * @param {number} hours The number of hours.
	 * @param {number} minutes Then number of minutes.
	 */
	constructor(hours, minutes) {
		this.hours = hours;
		this.minutes = minutes;
	}

	/**
	 * @returns {number} The number of hours.
	 */
	get hours() {
		return this.hours;
	}

	/**
	 * @returns {number} The number of minutes.
	 */
	get minutes() {
		return this.minutes;
	}

	/**
	 * Returns a new instance of Time where the number of minutes has been incremented by the specified value.
	 * The number of minutes will be restricted to a maximum of 59 and will carry over to the the number of hours.
	 * The number of hours will be restricted to a maximum of 23 and will simply reset to 0 if it overflows.
	 * Meant for use with non-zero values only.
	 * @param {number} minutes The number of minutes by which to increment the time relative to the current time.
	 * Should be a non-negative value.
	 * @returns {Time} A new instance of Time where the values have been incremented by the specified number of
	 * minutes relative to the current time.
	 */
	incrementMinutes(minutes) {
		let tmp_minutes = this.minutes;
		let tmp_hours = this.hours;

		tmp_minutes += minutes;
		tmp_hours += Math.floor(tmp_minutes / 60);
		tmp_hours %= 24;
		tmp_minutes %= 60;

		return new Time(tmp_hours, tmp_minutes);
	}

	/**
	 * Compares the current time to the specified time.
	 * @param {Time} that Another point in time
	 * @returns {number} 1 if this > that, 0 if this == that, -1 if this < that.
	 */
	compare(that) {
		if (this.hours > that.hours || (this.hours == that.hours && this.minutes > that.minutes)) return 1;
		else if (this.hours == that.hours && this.minutes == that.minutes) return 0;
		else return -1;
	};

	toString() {
		return (this.hours < 10 ? "0" : "") + this.hours + ":" + (this.minutes < 10 ? "0" : "") + this.minutes;
	}
}

/**
 * Represent a segment of time.
 */
class TimeRange {
	start;
	end;

	/**
	 * Create a new time slot with the specified start and end times.
	 * @param {Time} start The beginning of the time slot. Should be a value smaller than end.
	 * @param {Time} end The end of the time slot. Should be a value greater than start.
	 */
	constructor(start, end) {
		this.start = start;
		this.end = end;
	}

	/**
	 * @returns {Time} the start time of this time slot.
	 */
	get start() {
		return this.start;
	}

	/**
	 * @returns {Time} the end time of this time slot.
	 */
	get end() {
		return this.end;
	}

	/**
	 * Check if this time slot collides with that time slot.
	 * @param {TimeRange} that Another time slot.
	 * @returns {boolean} true if there is a collision, false if there isn't.
	 */
	collides(that) {
		return (
			((this.start.compare(that.start) >= 0 && this.start.compare(that.end) < 0) ||
			 (this.end.compare(that.start) > 0 && this.end.compare(that.end) <= 0))
		);
	}

	/**
	 * Check if this time slot contains that other time slot in its entirety.
	 * @param {TimeRange} that Another time slot.
	 * @returns {boolean} True if it's completely contained. False if not.
	 */
	contains(that) {
		return that.start.compare(this.start) >= 0 && that.end.compare(this.end) <= 0;
	}
	
	toString() {
		return this.start.toString() + "-" + this.end.toString();
	}
}

/**
 * A simple and immutable representation of a calendar date.
 */
class SimpleDate {

	/**
	 * The names of the days of the week as used in the database, for easy conversion between how
	 * it's stored in the database and how it's represented by the JS Date object.
	 */
	static day_names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

	year;
	month;
	day;
	
	/**
	 * Create a new SimpleDate object.
	 * @param {number} year Can be any value. 
	 * @param {number} month valid values: 0...11
	 * @param {number} day valid values: 0...31 (depends on the month) and null.
	 */
	constructor(year, month, day) {
		this.year = year;
		this.month = month;
		this.day = day;
	}

	/**
	 * @returns {number} The year. Can be any value.
	 */
	get year() {
		return this.year;
	}

	/**
	 * @returns {number} The month. Values 0...11.
	 */
	get month() {
		return this.month;
	}

	/**
	 * @returns {number} The day of the month. Values 0...31 and null.
	 */
	get day() {
		return this.day;
	}

	/**
	 * @returns {number} The day of the week. Values 0...6.
	 */
	get weekday() {
		return new Date(this.year, this.month, this.day).getDay();
	}

	/**
	 * @returns {string} The name of the day of the week, in lowercase.
	 */
	get dayname() {
		return SimpleDate.day_names[this.weekday];
	}

	/**
	 * Get the next month on the calendar.
	 * @returns {SimpleDate} A new date representing the next month on the calendar.
	 * @todo Take care of the day of the month too, in cases where its value is greater than the last day of the month.
	 */
	getNextMonth() {
		if (this.month == 11) {
			return new SimpleDate(this.year + 1, 0, this.day);
		}
		else {
			return new SimpleDate(this.year, this.month + 1, this.day);
		}
	}
	/**
	 * Get the previous month on the calendar.
	 * @returns {SimpleDate} A new date representing the previous month on the calendar.
	 * @todo Take care of the day of the month too, in cases where its value is greater than the last day of the month.
	 */
	getPreviousMonth() {
		if (this.month == 0) {
			return new SimpleDate(this.year - 1, 11, this.day);
		}
		else {
			return new SimpleDate(this.year, this.month - 1, this.day);
		}
	}

	/**
	 * Compares the current date to the specified time.
	 * @param {SimpleDate} that Another date
	 * @returns {number} 1 if this > that, 0 if this == that, -1 if this < that.
	 */
	compare(that) {
		if (this.year > that.year) return 1;
		if (this.year == that.year) {
			if (this.month > that.month) return 1;
			if (this.month == that.month) {
				if (this.day > that.day) return 1;
				if (this.day == that.day) return 0;
			}
		}

		return -1;
	}
}

// Public interface of server functions:

exports.getDoctor = functions.https.onCall((data, context) => {
	return getDoctor(data.id, data.field, data.city);
});

exports.searchDoctors = functions.https.onCall((data, context) => {
	return searchDoctors(data.name, data.field, data.city);
});

exports.getAvailableAppointments = functions.https.onCall((data, context) => {
	return getAvailableAppointments(data.doctor, data.clinic, data.date, data.type);
});

exports.makeAppointment = functions.https.onCall((data, context) => {
	return makeAppointment(data.doctor, data.clinic, data.patient, data.date, data.time, data.type);
});

exports.editAppointment = functions.https.onCall((data, context) => {
	return editAppointment(data.appointment, data.date, data.time, data.type);
});

// Helper methods:
/**
 * Check if the text containst the exact search term anywhere
 * @param {string} text The text in which to search
 * @param {string} search The search term
 * @returns {number} 0 if the search term was not found in the text, 1 if the search term was found in the text.
 */
const stringContains = (text, search) => {
	let src = (String) (text);
	let term = (String) (search);

	for (let i = 0; i < src.length; i++) {
		if (src.substr(i, term.length).toLowerCase() === term.toLowerCase()) {
			return true;
		}
	}

	return false;
}

/**
 * Get all occupied time slots for a specified date.
 * @param {string} doctor The id of the doctor
 * @param {string} clinic The id of the clinic
 * @param {SimpleDate} date The day in question
 * @returns {TimeRange[]} Array of occupied time slots.
 */
async function getAppointments(doctor, clinic, date) {
	// The time from the server is in UTC with no timezone offset data.
	// The client will have to implement the timezone offset in the display.

	// Set the time range for the appointments to be exactly the day in question:
	const start_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day));
	const end_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day + 1));

	// First get all of the booked time ranges:
	const appointments = [];

	await db.collection("appointments").orderBy("start")
	.where("start", ">=", start_day)
	.where("start", "<", end_day)
	.where("clinic", "==", clinic)
	.where("doctor", "==", doctor)
	.get().then(snapshots => {
		snapshots.forEach(snapshot => {
			const start_time = new Time(snapshot.data().start.toDate().getUTCHours(), snapshot.data().start.toDate().getUTCMinutes());
			const end_time = start_time.incrementMinutes(snapshot.data().duration);

			appointments.push(new TimeRange(start_time, end_time));
		});
	});

	return appointments;
}

/**
 * Check if the speciefied time slot is available.
 * @param {TimeRange[]} appointments An array of time slots that have already been booked.
 * @param {TimeRange} slot
 * @returns {boolean} Return true if there is a collision, false if there isn't. (Temporarily returning 0,1)
 */
const appointmentCollides = (appointments, slot) => {
	let collides = false;

	if (appointments.length > 0) {
		appointments.forEach(appointment => {
			if (slot.collides(appointment)) {
				collides = true;
				return;
			}
		});
	}

	return collides;
}

/**
 * Check if the specified time slot if available.
 * @todo Consider switching to using Slot instead of time and type.
 * @todo Switch to using SimpleDate, Time, and Slot objects instead of ad-hoc objects.
 * @param {string} doctor The id of the doctor for which the appointment is being requested.
 * @param {string} clinic The id of the clinic for which the appointment is being requested.
 * @param {SimpleDate} date The requested date of the appointment.
 * @param {TimeRange} slot The requested time of the appointment.
 * @param {string} type The type of appointment.
 * @returns {boolean} true if available, false if unavailable (temporarily returning 0,1)
 */
async function isAvailable(doctor, clinic, date, slot, type) {
	// Get all the unavailable time slots:
	const appointments = await getAppointments(doctor, clinic, date);
	
	/**
	 * Store wether of not the requested time slot is available. By default, no.
	 */
	let okay = false;
	
	// Get the all the schedules for the specified doctor at the specified clinic
	// (there should only be one, since each doctor should only have 1 schedule per clinic,
	// but it will return a snapshot of multiple results that need to be iterated over, of size 1):
	await db.collection("slots")
	.where("clinic", "==", clinic)
	.where("doctor", "==", doctor)
	.get().then(snapshots => {
		snapshots.forEach(snapshot => {
			const weekly = new Map(Object.entries(snapshot.data().weekly));

			// Get the schedule for the requested day of the week, if it exists:
			if (weekly.has(date.dayname)) {
				const schedule = weekly.get(date.dayname);
				
				// The schedule can consist of multiple shifts. Check each of them:
				schedule.forEach(shift => {
					const timeRange = new TimeRange(new Time(shift.start.toDate().getHours(), shift.start.toDate().getMinutes()),
																					new Time(shift.end.toDate().getHours(), shift.end.toDate().getMinutes()));
					
					// Check if the requested slot for the appointment is both within the time
					// limit of the shift and doesn't collide with an existing appointment:
					if (timeRange.contains(slot) && !appointmentCollides(appointments, slot)) {
						okay = true;
						return;
					}
				});
			}
		});
	});

	// Return the available time slots:
	return okay;
}

// API implementation code:

/**
 * Get the requested doctor and then filter the results field of specialization and the city where the clinic is.
 * Except for id, all params are optional. If no parameters are specified (or if the value is falsy), then it will return all the data.
 * @todo Be more picky about which data is being returned.
 * @param {string} id The id of the doctor.
 * @param {string} field The doctor's specialization.
 * @param {string} city The city in which service is being sought.
 * @returns {{doctor: object, user: object, clinics: object[], fields: string[]}} The data of the requested doctor.
 */
async function getDoctor(id, field, city) {
	// Fetch the data of all the doctor documents:
	const result = {
		doctor: null, // The doctor data.
		user: null, // The user data.
		clinics: [], // An array of the data of all the matching clinics associated with this doctor.
		fields: [], // An array of the ids of all the matching specializations of this doctor.
	};

	await db.collection("doctors").doc(id).get().then(doctor_snapshot => {
		result.doctor = doctor_snapshot.data();
		result.doctor.id = doctor_snapshot.id;
	});
	
	// Get the user data from refs:
	await result.doctor.user.get().then(user_snapshot => {
		result.user = user_snapshot.data();
		result.user.id = user_snapshot.id;
	});

	// Get the field data for the given doctor:
	for (i in result.doctor.fields) {
		await result.doctor.fields[i].get().then(field_snapshot => {
			// Check if the field is unspecified or is a match:
			if ((field && stringContains(field_snapshot.id, field)) || !field) {
				let field_data = field_snapshot.data();
				field_data.id = field_snapshot.id;
				result.fields.push(field_data);
			}
		});
	}

	// Get the clinic data for the given doctor:
	for (i in result.doctor.clinics) {
		await result.doctor.clinics[i].get().then(clinic_snapshot => {
			// Check if the field is unspecified or is a match:
			if ((city && stringContains(clinic_snapshot.data().city, city)) || !city) {
				let city_data = clinic_snapshot.data();
				city_data.id = clinic_snapshot.id;
				result.clinics.push(city_data);
			}
		});
	};
	
	return result;
}

/**
 * Get all doctors and then filter the results by name, field of specialization, and the city where their clinic is.
 * All params are optional. If no parameters are specified (or if the value is falsy), then it will return all doctors.
 * @todo Change the format of the data that is being returned and be more picky about which data is being returned.
 * @param {string} name The name of the doctor.
 * @param {string} field The doctor's specialization.
 * @param {string} city The city in which service is being sought.
 * @returns {{doctor: object, user: object, clinics: object[], fields: string[]}[]} An array of the data of matching doctors.
 */
async function searchDoctors(name, field, city) {
	// Fetch the data of all the doctor documents:
	const doctors = [];

	await db.collection("doctors").get().then(snapshots => {
		snapshots.forEach(snapshot => {
			let doctor = snapshot.data();
			doctor.id = snapshot.id;

			doctors.push({
				doctor: doctor, // The doctor data.
				user: null, // The user data.
				clinics: [], // An array of the data of all the matching clinics associated with this doctor.
				fields: [], // An array of the ids of all the matching specializations of this doctor.
			});
		});
	});
	
	for (const doctor of doctors) {
		// Get the user data from refs:
		await doctor.doctor.user.get().then(user_snapshot => {
			doctor.user = user_snapshot.data();
			doctor.user.id = user_snapshot.id;
		});

		// Check if the name is unspecified or is a match:
		let fullName = doctor.user.firstName + " " + doctor.user.lastName;

		// Only consider doctors who's name is a match or not specified:
		if ((name && stringContains(fullName, name)) || !name) {
			// Get the field data for the given doctor:
			for (i in doctor.doctor.fields) {
				await doctor.doctor.fields[i].get().then(field_snapshot => {
					// Check if the field is unspecified or is a match:
					if ((field && stringContains(field_snapshot.id, field)) || !field) {
						let field_data = field_snapshot.data();
						field_data.id = field_snapshot.id;
						doctor.fields.push(field_data);
					}
				});
			}

			// Get the clinic data for the given doctor:
			for (i in doctor.doctor.clinics) {
				await doctor.doctor.clinics[i].get().then(clinic_snapshot => {
					// Check if the field is unspecified or is a match:
					if ((city && stringContains(clinic_snapshot.data().city, city)) || !city) {
						let city_data = clinic_snapshot.data();
						city_data.id = clinic_snapshot.id;
						doctor.clinics.push(city_data);
					}
				});
			};
		}
	}

	// Only add to the results the doctors who have both fields and clinics that are a match:
	const results = [];
	for (const doctor of doctors) {
		if (doctor.clinics.length > 0 && doctor.fields.length > 0) {
			results.push(doctor);
		}
	}

	return results;
}

/**
 * Get all available time slots for a specified date.
 * If appointment type is specified then it will get only time slots that are big enough to accomodate it.
 * @todo use the Time, Slot, and SimpleDate classes and methods instead of ad-hoc objects and global functions.
 * @param {string} doctor The id of the doctor.
 * @param {string} clinic The id of the clinic.
 * @param {SimpleDate} date The date for which available appointments are being queried.
 * @param {string} type The type of appointment.
 * @return {TimeRange[]} An array of available time slots.
 */
async function getAvailableAppointments(doctor, clinic, date, type) {
	date = new SimpleDate(date.year, date.month, date.day);
	// The time from the server is in UTC with no timezone offset data.

	// First get all of the booked time ranges:
	let appointments = await getAppointments(doctor, clinic, date);

	// Then get all of the time slots while leaving out the ones that are already booked:
	let slots = [];
	
	// Get all the weekly schedules for the specified doctor at the specified clinic (there should only be one):
	await db.collection("slots")
	.where("clinic", "==", clinic)
	.where("doctor", "==", doctor)
	.get().then(snapshots => {
		snapshots.forEach(snapshot => {
			const weekly = new Map(Object.entries(snapshot.data().weekly));
			
			// Get the schedule for the requested day of the week, if it exists:
			if (weekly.has(date.dayname)) {
				const schedule = weekly.get(date.dayname);
				
				// The schedule can consist of multiple shifts. Go over each of them:
				schedule.forEach(shift => {
					// TODO use Slot object:
					let now = new Time(shift.start.toDate().getUTCHours(), shift.start.toDate().getUTCMinutes());
					const end = new Time(shift.end.toDate().getUTCHours(), shift.end.toDate().getUTCMinutes());
					
					// For each shift, add all of the time slots that don't
					// collide with existing appointments To the slots array:
					while (now.compare(end) < 0) {
						const slot = new TimeRange(now, now.incrementMinutes(shift.size));
						
						if (!appointmentCollides(appointments, slot)) {
							slots.push(slot);
						}
	
						now = now.incrementMinutes(shift.size);
					}
				});
			}
		});
	});

	return slots;
}

/**
 * Make an appointment, if the time slot that is requested is available.
 * @todo use session tokens to verify that the user making the appointment
 * is the user for which the appointment is being made.
 * @todo set appointment duration based on rules set by the doctor/clinic.
 * @todo more refined return value.
 * @param {string} doctor The id of the doctor
 * @param {string} clinic The id of the clinic
 * @param {string} patient The id of the patient
 * @param {SimpleDate} date The date of the appointment
 * @param {Time} time The time of the appointment
 * @param {string} type The type of appointment
 * @returns {{id: string, messages: string[]}} The id is the id of the new appointment. Messages contains the error messages.
 */
async function makeAppointment(doctor, clinic, patient, date, time, type) {
	let response = {
		id: null,
		messages: []
	};

	if (!doctor) {
		response.messages.push("missing doctor");
	}
	
	if (!clinic) {
		response.messages.push("missing clinic");
	}
	
	if (!patient) {
		response.messages.push("missing patient");
	}
	
	if (!date) {
		response.messages.push("missing date");
	}
	
	if (!time) {
		response.messages.push("missing time");
	}
	
	if (!type) {
		response.messages.push("missing type");
	}
	
	if (response.messages.length == 0) {
		const start = new Date(date.year, date.month, date.day, time.hours, time.minutes);
		date = new SimpleDate(date.year, date.month, date.day);

		const start_time = new Time(start.getHours(), start.getMinutes());
		const end_time = start_time.incrementMinutes(15);
		const slot = new TimeRange(start_time, end_time);

		if (await isAvailable(doctor, clinic, date, slot, type)) {
			const appointment = {
				clinic: clinic,
				doctor: doctor,
				patient: patient,
				start: start,
				duration: 15,
				type: type
			};
			await db.collection("appointments").add(appointment)
			.then(value => {
				db.collection("users").doc(patient).collection("appointments").doc(value.id).set(appointment);
				response.id = value.id;
			})
			.catch(reason => {
				console.error(reason);
				response.messages.push("Adding the appointment failed");
			});
		}
		else {
			response.messages.push("The appointment is unavailable");
		}
	}

	return response;
}

/**
 * Edit an appointment, if the time slot that is requested is available.
 * @todo use session tokens to verify that the user making the appointment
 * is the user for which the appointment is being made.
 * @todo set appointment duration based on rules set by the doctor/clinic.
 * @todo more refined return value.
 * @param {string} appointment The id of the appointment
 * @param {SimpleDate} date The date of the appointment
 * @param {Time} time The time of the appointment
 * @param {string} type The type of appointment
 * @returns {{id: string, messages: string[]}} The id is the id of the new appointment. Messages contains the error messages.
 */
 async function editAppointment(appointment, date, time, type) {
	let response = {
		id: null,
		messages: []
	};

	if (!appointment) {
		response.messages.push("missing appointment");
	}
	
	if (!date && !time && !type) {
		response.messages.push("no change requested");
	}
	
	if (response.messages.length == 0) {
		// Use existing data as default value. Override with new data:
		const old_data = await db.collection("appointments").doc(appointment).get().then(snapshot => {return snapshot.data()});
		const old_date = new Date(old_data.start.toDate());
		const old_time = new Time(old_date.getUTCHours(), old_date.getUTCMinutes());

		let new_date = new SimpleDate(old_date.getUTCFullYear(), old_date.getUTCMonth(), old_date.getUTCDate());
		let new_time = new Time(old_time.hours, old_time.minutes);
		let new_type = old_data.type;

		if (date) {
			new_date = new SimpleDate(date.year, date.month, date.day);
		}

		console.log("old time: " + old_time.toString());	
		if (time) {
			new_time = new Time(time.hours, time.minutes);
			console.log("time: " + new_time.toString());
		}

		if (type) {
			new_type = type;
		}

		const new_data = {
			start: new Date(new_date.year, new_date.month, new_date.day, new_time.hours, new_time.minutes),
			type: new_type
		}

		// Create the slot object for checking the availability of the new time:
		// What if the new time is the same as the old time?

		const start_time = new Time(new_time.hours, new_time.minutes);
		const end_time = start_time.incrementMinutes(old_data.duration);
		const slot = new TimeRange(start_time, end_time);

		/**
		 * @todo Instead, check if the new time is available under the assumption that the current time is not taken, since there are appointments of various lengths
		 * and so the time slots can overlap, so if an appointment is 30 minutes and you want to move it 15 minutes earlier you'll get that it's unvailable.
		 *  */
		const unchanged = (new_date.compare(new SimpleDate(old_date.getUTCFullYear(), old_date.getUTCMonth(), old_date.getUTCDate())) === 0 && new_time.compare(old_time) === 0);
		const available = await isAvailable(old_data.doctor, old_data.clinic, new_date, slot, new_type);

		if (unchanged || available) {
			await db.collection("appointments").doc(appointment).update(new_data)
			.then(value => {
				db.collection("users").doc(old_data.patient).collection("appointments").doc(appointment).update(new_data);
				response.id = appointment;
			})
			.catch(reason => {
				console.error(reason);
				response.messages.push("Updating the appointment failed");
			});
		}
		else {
			response.messages.push("The new requested time is unavailable");
		}
	}

	return response;
}