const fs = require("@google-cloud/firestore");

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

const doctors = require("./doctors");
const clinics = require("./clinics");

/**
 * @todo Make the 2 classes files identical and get rid of the redundancy:
 */

const Time = require("./Time").Time;
const Slot = require("./Slot").Slot;
const SimpleDate = require("./SimpleDate").SimpleDate;

// Helper functions
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

			appointments.push(new Slot(start_time, end_time));
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
					const timeRange = new Slot(new Time(shift.start.toDate().getHours(), shift.start.toDate().getMinutes()),
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
 * Get all the data of the appointment.
 * @param {string} id The id of the appointment.
 * @returns {{appointment: object, doctor: object, clinic: object}} An object containing all the relevant data.
 */
async function get(id) {
	let data = {
		appointment: null,
		doctor: null,
		clinic: null,
		extra: {
			date: null,
			time: null
		}
	};

	await db.collection("appointments").doc(id).get().then(appointment_snap => {
		data.appointment = appointment_snap.data();
		data.appointment.id = id;
	});

	await doctors.get(data.appointment.doctor).then(doctor => {
		data.doctor = doctor;
	});

	await clinics.get(data.appointment.clinic).then(clinic => {
		data.clinic = clinic;
	});

	const date = new Date(data.appointment.start.toDate());
	data.extra.date = new SimpleDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
	data.extra.time = new Time(date.getUTCHours(), date.getUTCMinutes());

	return data;
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
async function getAvailable(doctor, clinic, date, type) {
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
						const slot = new Slot(now, now.incrementMinutes(shift.size));
						
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
 async function add(doctor, clinic, patient, date, time, type) {
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
		const slot = new Slot(start_time, end_time);

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
				db.collection("doctors").doc(doctor).collection("appointments").doc(value.id).set(appointment);
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
 async function edit(appointment, date, time, type) {
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

		if (time) {
			new_time = new Time(time.hours, time.minutes);
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
		const slot = new Slot(start_time, end_time);

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
				db.collection("doctors").doc(old_data.doctor).collection("appointments").doc(appointment).update(new_data);
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

/**
 * Cancel an existing appointment.
 * @todo use session tokens to verify that the user canceling the appointment
 * is the user for which the appointment has been made.
 * @param {string} appointment The id of the appointment
 * @returns {{success: boolean, messages: string[]}} The id is the id of the new appointment. Messages contains the error messages.
 */
 async function cancel(appointment) {
	const response = {
		success: false,
		messages: []
	};

	let user_appointment;
	let doctor_appointment;
	let general_appointment = db.collection("appointments").doc(appointment);

	await general_appointment.get().then(snapshot => {
		if (snapshot.exists) {
			user_appointment = db.collection("users").doc(snapshot.data().patient).collection("appointments").doc(appointment);
			doctor_appointment = db.collection("doctors").doc(snapshot.data().doctor).collection("appointments").doc(appointment);
		}
	});

	if (user_appointment) {
		await general_appointment.delete();
		await user_appointment.delete();
		await doctor_appointment.delete()

		response.success = true;
	}
	else {
		response.messages.push("appointment doesn't exist");
	}


	return response;
 }
exports.get = get;
exports.getAvailable = getAvailable;
exports.add = add;
exports.edit = edit;
exports.cancel = cancel;