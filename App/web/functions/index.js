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

/**
 * The names of the days of the week as used in the database, for easy conversion between how
 * it's stored in the database and how it's represented by the JS Date object.
 */
const day_names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Custom data types:
/**
 * Represents an time in terms of hours and minutes.
 * Is supposed to be immutable.
 */
class Time {
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
	incrementTime(minutes) {
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
	compareTime(that) {
		if (this.hours > that.hours || (this.hours == that.hours && this.minutes > that.minutes)) return 1;
		else if (this.hours == that.hours && this.minutes == that.minutes) return 0;
		else return -1;
	};
}

/**
 * Represent a segment of time.
 */
class Slot {
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
	 * @param {Slot} that Another time slot.
	 * @returns {boolean} true if there is a collision, false if there isn't.
	 */
	collides(that) {
		return (
			((this.start.compareTime(that.start) >= 0 && this.start.compareTime(that.end) < 0) ||
			 (this.end.compareTime(that.start) >= 0 && this.end(that.end) < 0))
		);
	}
}

/**
 * A simple and immutable representation of a calendar date.
 */
class SimpleDate {
	/**
	 * Create a new SimpleDate object.
	 * @param {number} year Can be any value. 
	 * @param {number} month valid values: 0...11
	 * @param {number} day valid values: 0...6 and null.
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
	 * @returns {number} The day. Values 0...6 and null.
	 */
	get day() {
		return this.day;
	}
}
// Public interface of server functions:
exports.searchDoctors = functions.https.onCall((data, context) => {
	return searchDoctors(data.name, data.field, data.city);
});

exports.getAvailableAppointments = functions.https.onCall((data, context) => {
	return getAvailableAppointments(data.doctor, data.clinic, data.date, data.type);
});

exports.makeAppointment = functions.https.onCall((data, context) => {
	return makeAppointment(data.doctor, data.clinic, data.patient, data.date, data.time, data.type);
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
 * Compares between two custom objects that represent time in hourse and minutes.
 * @param {{hours:number, minutes:number}} now One point in time
 * @param {{hours:number, minutes:number}} then Another point in time
 * @returns {number} 1 if now > then, 0 if now == then, -1 if now < then.
 * @deprecated in favor of the use of Time.compareTime(Time)
 */
const compare_time = (now, then) => {
	if (now.hours > then.hours || (now.hours == then.hours && now.minutes > then.minutes)) return 1;
	else if (now.hours == then.hours && now.minutes == then.minutes) return 0;
	else return -1;
};

/**
 * Increments the given time object by the given number of minutes. This function will mutate the now parameter.
 * Not tested for anything other than a positive number of minutes.
 * @param {{hours:number, minutes:number}} now The time object that is to be modified.
 * @param {number} minutes The amount of minutes that the now parameter is to be incremented by.
 * @deprecated in favor of the use of Time.incrementTime(number)
 */
const increment_time = (now, minutes) => {
	now.minutes += minutes;
	now.hours += Math.floor(now.minutes / 60);
	now.minutes %= 60;
};

/**
 * Get all occupied time slots for a specified date.
 * @todo Switch to using SimpleDate, Time, and Slot objects instead of ad-hoc objects.
 * @param {string} doctor The id of the doctor
 * @param {string} clinic The id of the clinic
 * @param {SimpleDate} date The day in question
 * @returns {Slot[]} Array of occupied time slots, each an object in the format of:
 * {start: time, end: time}
 * where time is an object in the format of:
 * {hours: number, minutes: number}
 */
async function getAppointments(doctor, clinic, date) {
	// The time from the server is in UTC with no timezone offset data.
	// The client will have to implement the timezone offset in the display.

	// Set the time range for the appointments to be exactly the day in question:
	const start_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day));
	const end_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day + 1));
	const week_day = new Date(date.year, date.month, date.day).getDay();

	// First get all of the booked time ranges:
	const appointments = [];

	await db.collection("appointments")
	.where("clinic", "==", clinic)
	.where("doctor", "==", doctor)
	.where("start", ">=", start_day)
	.where("start", "<", end_day)
	.get().then(snapshots => {
		snapshots.forEach(snapshot => {
			const start_time = {
				hours: snapshot.data().start.toDate().getHours(),
				minutes: snapshot.data().start.toDate().getMinutes()
			};

			let end_time = {
				hours: start_time.hours,
				minutes: start_time.minutes
			}

			increment_time(end_time, snapshot.data().duration);

			appointments.push({
				start: start_time,
				end: end_time
			});
		});
	});

	return appointments;
}

/**
 * Check if the speciefied time slot is available.
 * @todo use a single Slot object to represent the start and end times.
 * @todo use a boolean for the return value.
 * @todo Switch to using SimpleDate, Time, and Slot objects instead of ad-hoc objects.
 * @param {Slot[]} appointments An array of time slots that have already been booked.
 * @param {Time} start The start of the time slot to be checked for availability.
 * @param {Time} end The end of the time slot to be checked for availability.
 * @returns {number} Return true if there is a collision, false if there isn't. (Temporarily returning 0,1)
 */
const appointmentCollides = (appointments, start, end) => {
	let collides = false;
	
	if (appointments.length > 0) {
		appointments.forEach(appointment => {
			// TODO use Slot.collides(other):
			if ((compare_time(start, appointment.start) >= 0 && compare_time(start, appointment.end) < 0) ||
					(compare_time(end, appointment.start) >= 0 && compare_time(end, appointment.end) < 0)) {
				collides = true;
				return;
			}
		});
	}

	return (collides ? 1 : 0);
}

/**
 * Check if the specified time slot if available.
 * @todo Consider switching to using Slot instead of time and type.
 * @todo Switch to using SimpleDate, Time, and Slot objects instead of ad-hoc objects.
 * @param {string} doctor The id of the doctor for which the appointment is being requested.
 * @param {string} clinic The id of the clinic for which the appointment is being requested.
 * @param {SimpleDate} date The requested date of the appointment.
 * @param {Time} time The requested time of the appointment.
 * @param {string} type The type of appointment.
 * @returns {boolean} true if available, false if unavailable (temporarily returning 0,1)
 */
async function isAvailable(doctor, clinic, date, time, type) {
	// Get all the unavailable time slots:
	const appointments = getAppointments(doctor, clinic, date);

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
			if (weekly.has(day_names[week_day])) {
				const schedule = weekly.get(day_names[week_day]);

				// The schedule can consist of multiple shifts. Check each of them:
				schedule.forEach(slot => {
					// TODO use Slot objects:
					const start = {
						hours: slot.start.toDate().getHours(),
						minutes: slot.start.toDate().getMinutes()
					}
	
					const end = {
						hours: slot.end.toDate().getHours(),
						minutes: slot.end.toDate().getMinutes()
					}

					// Check if the requested slot for the appointment is both within the time
					// limit of the shift and doesn't collide with an existing appointment:
					if (compare_time(time.start, start) >= 0 && compare_time(time.end, end) <= 0 && appointmentCollides(appointments, time.start, time.end) == 0) {
						okay = true;
						return;
					}
				});
			}
		});
	});

	// Return the available time slots:
	return (okay ? 1 : 0);
}

// API implementation code:

/**
 * Get all doctors and then filter the results by name, field of specialization, and the city where their clinic is.
 * All params are optional. If no parameters are specified (or if the value is falsy), then it will return all doctors.
 * @todo Change the format of the data that is being returned and be more picky about which data is being returned.
 * @param {string} name The name of the doctor.
 * @param {string} field The doctor's specialization.
 * @param {string} city The city in which service is being sought.
 * @returns {{id: string, user: object, doctor: object, clinics: object[], fields: string[]}[]} An array of the data of matching doctors.
 */
async function searchDoctors(name, field, city) {
	// Fetch the data of all the doctor documents:
	const doctors = [];

	await db.collection("doctors").get().then(snapshots => {
		snapshots.forEach(snapshot => {
			doctors.push({
				id: null, // The user id of the user associated with this doctor profile.
				user: null, // The user data.
				doctor: snapshot.data(), // The doctor data.
				clinics: [], // An array of the data of all the matching clinics associated with this doctor.
				fields: [], // An array of the ids of all the matching specializations of this doctor.
			});
		});
	});
	
	for (const doctor of doctors) {
		// Get the user data from refs:
		await doctor.doctor.user.get().then(user_snapshot => {
			doctor.id = user_snapshot.id;
			doctor.user = user_snapshot.data();
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
						doctor.fields.push(field_snapshot.id);
					}
				});
			}

			// Get the clinic data for the given doctor:
			for (i in doctor.doctor.clinics) {
				await doctor.doctor.clinics[i].get().then(clinic_snapshot => {
					// Check if the field is unspecified or is a match:
					if ((city && stringContains(clinic_snapshot.data().city, city)) || !city) {
						let temp = clinic_snapshot.data();
						temp.id = clinic_snapshot.id;
						doctor.clinics.push(temp);
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
 * @return {Slot[]} An array of available time slots.
 */
async function getAvailableAppointments(doctor, clinic, date, type) {
	// The time from the server is in UTC with no timezone offset data.
	const day_names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

	//Set the time range for the appointments to be exactly the day in question:
	const start_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day));
	const end_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day + 1));
	const week_day = new Date(date.year, date.month, date.day).getDay();

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
			if (weekly.has(day_names[week_day])) {
				const schedule = weekly.get(day_names[week_day]);

				// The schedule can consist of multiple shifts. Go over each of them:
				schedule.forEach(slot => {
					// TODO use Slot object:
					let now = {
						hours: slot.start.toDate().getHours(),
						minutes: slot.start.toDate().getMinutes()
					}
	
					const end = {
						hours: slot.end.toDate().getHours(),
						minutes: slot.end.toDate().getMinutes()
					}

					// For each shift, add all of the time slots that don't
					// collide with existing appointments To the slots array:
					while (compare_time(now, end) < 0) {
						let end_time = {
							hours: now.hours,
							minutes: now.minutes
						}
	
						increment_time(end_time, slot.size);
	
						if (appointmentCollides(appointments, now, end_time) == 0) {
							slots.push({
								start: {
									hours: now.hours,
									minutes: now.minutes
								},
								end: {
									hours: end_time.hours,
									minutes: end_time.minutes
								}
							});
						}
	
						increment_time(now, slot.size);
					}
				});
			}
		});
	});

	// Return the available time slots:
	return slots;
}

/**
 * Make and appointment, if the time slot that is requested is available.
 * @todo use session tokens to verify that the user making the appointment
 * is the user for which the appointment is being made.
 * @todo set appointment duration based on rules set by the doctor/clinic.
 * @param {string} doctor The id of the doctor
 * @param {string} clinic The id of the clinic
 * @param {string} patient The id of the patient
 * @param {SimpleDate} date The date of the appointment
 * @param {Time} time The time of the appointment
 * @param {string} type The type of appointment
 * @returns A promise that will complete once the appointment has been added to the database.
 */
function makeAppointment(doctor, clinic, patient, date, time, type) {
	const appointments = getAppointments(doctor, clinic, date);

	if (isAvailable(doctor, clinic, date, time, type)) {
		return db.collection("appointments").add({
			clinic: clinic,
			doctor: doctor,
			patient: patient,
			start: new Date(date.year, date.month, date.day, time.hours, time.minutes, 0),
			duration: 15,
			type: type
		})
	}
}