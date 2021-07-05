// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const fs = require("@google-cloud/firestore");

const { SimpleDate } = require('../utilities/SimpleDate');
const { Time } = require('../utilities/Time');
const { Slot } = require('../utilities/Slot');

// /**
//  * Get all available time slots for a specified date.
//  * If appointment type is specified then it will get only time slots that are big enough to accomodate it.
//  * This is one of the few functions that has to be on Cloud Functions to make sure that appointments are only made at correct times.
//  * @todo use the Time, Slot, and SimpleDate classes and methods instead of ad-hoc objects and global functions.
//  * @param {{admin: *}} env
//  * @param {{CLINICS: string, APPOINTMENTS: string, TYPES: string}} globals
//  * @param {{clinic: string, doctor: string, date: {year: number, month: number, day: number}, type: string}} params
//  * @return {Promise<Slot[]>} An array of available time slots.
//  */
// async function getAvailable(env, globals, params) {
// 	const db = env.admin.firestore();
// 	const {CLINICS, APPOINTMENTS, TYPES} = {...globals};
// 	const {clinic, doctor, date, type} = {...params};

// 	const simpleDate = SimpleDate.fromObject(date);

// 	const doctorRef = db.collection("clinics").doc(clinic).collection("doctors").doc(doctor);

// 	/**
// 	 * The minimum appointment duration in minutes.
// 	 * @type {number}
// 	 */
// 	const minimum = await doctorRef.get().then(doctor_snap => {
// 		return doctor_snap.data().minimum;
// 	});

// 	// // The different appointment types with their durations.
// 	// /**
// 	//  * @type {Map<string, number>}
// 	//  */
// 	// const types = await doctorRef.collection(TYPES).get().then(type_snaps => {
// 	// 	const types = new Map();

// 	// 	for (const type of type_snaps.docs) {
// 	// 		if (type.data().name) types.set(type.data().name, type.data().duration);
// 	// 	}

// 	// 	return types;
// 	// });

// 	// /**
// 	//  * The duration of the selected appointment type.
// 	//  * @type {number}
// 	//  */
// 	// const duration = types.get(type) * minimum;

// 	// The different appointment types with their durations.
// 	// /**
// 	//  * @type {number}
// 	//  */

// 	 const duration = await doctorRef.collection(TYPES).get().then(type_snaps => {
// 		for (const type_snap of type_snaps.docs) {
// 			if (type_snap.data().name === type) return type_snap.data().duration * minimum;
// 		}
// 	});

// 	// /**
// 	//  * The date for which available appoinetment slots are being fetched.
// 	//  * @type {SimpleDate}
// 	//  */
// 	// // const simpleDate = new SimpleDate(simpleDate);

// 	// Set the time range for the appointments to be exactly the day in question:
// 	const start_day = fs.Timestamp.fromDate(simpleDate.toDate());
// 	const end_day = fs.Timestamp.fromDate(simpleDate.getNextDay().toDate());

// 	// Get all of the booked time ranges:
// 	const appointments = await db.collection(CLINICS).doc(clinic).collection(APPOINTMENTS)
// 	.orderBy("start")
// 	.where("start", ">=", simpleDate.toDate())
// 	.where("start", "<", simpleDate.getNextDay().toDate())
// 	.where("doctor", "==", doctor)
// 	// .where("verified", "==", true)
// 	.get().then(appointment_snaps => {
// 		const appointments = [];

// 		for (const appointment_snap of appointment_snaps.docs) {
// 			/**
// 			 * @type {Date}
// 			 */
// 			const start_datetime = appointment_snap.data().start.toDate();
// 			start_datetime.setMinutes(start_datetime.getUTCMinutes() - appointment_snap.data().offset);

// 			const end_datetime = appointment_snap.data().end.toDate();
// 			end_datetime.setMinutes(end_datetime.getUTCMinutes() - appointment_snap.data().offset);
			
// 			const start_time = Time.fromDate(start_datetime);
// 			const end_time = Time.fromDate(end_datetime);
// 			const slot = new Slot(start_time, end_time);

// 			appointments.push(slot);
// 		}

// 		return appointments;
// 	});

// 	// Get the shift schedule for the day:
// 	return doctorRef.collection("shifts").get().then(shift_snaps => {
// 	/**
// 	 * The available time slots
// 	 * @type {Slot[]}
// 	 */
// 	const available = [];

// 		/**
// 		 * The shifts for the selected day of the week.
// 		 * @type {Slot[]}
// 		 */
// 		const day = [];

// 		for (const shift_snap of shift_snaps.docs) {
// 			if (shift_snap.data().day === simpleDate.weekday) {
// 				day.push(new Slot(
// 					Time.fromObject(shift_snap.data().start),
// 					Time.fromObject(shift_snap.data().end)
// 				));
// 			}
// 		}

// 		// Find all available time slots within each shift:
// 		for (const shift of day) {
// 			// The size of each time slot should be duration. The start time of the slots should be incremented by minimum.
// 			// This is to get all slots for the appointment type while keeping the appointments aligned with each other.

// 			let current_slot = new Slot(shift.start, shift.start.incrementMinutes(duration));

// 			while (shift.contains(current_slot)) {
// 				// If the current time slot doesn't collide with the occupied time slots:
// 				let collides = false;

// 				for (const appointment of appointments) {
// 					if (current_slot.collides(appointment)) {
// 						collides = true;
// 						break;
// 					}
// 				}
			
// 				if (!collides) {
// 					available.push(
// 						current_slot
// 						// {
// 						// 	start: new Date(simpleDate.year, simpleDate.month, simpleDate.day, current_slot.start.hours, current_slot.start.minutes).getTime(),
// 						// 	end: new Date(simpleDate.year, simpleDate.month, simpleDate.day, current_slot.end.hours, current_slot.end.minutes).getTime(),
// 						// }
// 					);
// 				}

// 				// Increment both the start and end times by minimum to check the next time slot while keeping the size of the slot the same:
// 				current_slot = new Slot(current_slot.start.incrementMinutes(minimum),
// 					current_slot.end.incrementMinutes(minimum));
// 			}
// 		}

// 		return available;
// 	});
// }

/**
 * Get the minimum appointment duration for the given doctor at the given clinic in minutes.
 * @param {{admin: *}} env
 * @param {{CLINICS: string, DOCTORS: string}} globals
 * @param {{clinic: string, doctor: string}} params
 * @returns {number}
 */
async function getMinimum(env, globals, params) {
	return await
	env.admin.firestore()
	.collection(globals.CLINICS).doc(params.clinic)
	.collection(globals.DOCTORS).doc(params.doctor)
	.get().then(doctor_snap => {
		return doctor_snap.data().minimum;
	});
}

/**
 * The requested appointment duration in minutes.
 * @param {{admin: *}} env
 * @param {{CLINICS: string, DOCTORS: string, TYPES: string}} globals
 * @param {{clinic: string, doctor: string, type: string, minimum: number}} params
 * @returns {number}
 */
async function getDuration(env, globals, params) {
	return await 
	env.admin.firestore()
	.collection(globals.CLINICS).doc(params.clinic)
	.collection(globals.DOCTORS).doc(params.doctor)
	.collection(globals.TYPES)
	.get().then(type_snaps => {
		for (const type_snap of type_snaps.docs) {
			if (type_snap.data().name === params.type) return type_snap.data().duration * params.minimum;
		}
	});
}

/**
 * Get all of the booked time ranges for the requested date
 * @param {{admin: *}} env
 * @param {{CLINICS: string, APPOINTMENTS: string}} globals
 * @param {{clinic: string, doctor: string}} params
 * @returns {Slot[]}
 */
async function getOccupiedSlots(env, globals, params) {
	const simpleDate = SimpleDate.fromObject(params.date);

	return await 
	env.admin.firestore()
	.collection(globals.CLINICS).doc(params.clinic)
	.collection(globals.APPOINTMENTS)
	.orderBy("start")
	.where("start", ">=", simpleDate.toDate())
	.where("start", "<", simpleDate.getNextDay().toDate())
	.where("doctor", "==", params.doctor)
	.get().then(appointment_snaps => {
		/**
		 * @type {Slot[]}
		 */
		const occupied = [];

		for (const appointment_snap of appointment_snaps.docs) {
			/**
			 * @type {Date}
			 */
			const start_datetime = appointment_snap.data().start.toDate();
			start_datetime.setMinutes(start_datetime.getUTCMinutes() - appointment_snap.data().offset);

			const end_datetime = appointment_snap.data().end.toDate();
			end_datetime.setMinutes(end_datetime.getUTCMinutes() - appointment_snap.data().offset);
			
			const start_time = Time.fromDate(start_datetime);
			const end_time = Time.fromDate(end_datetime);
			const slot = new Slot(start_time, end_time);

			occupied.push(slot);
		}

		return occupied;
	});
}

/**
 * Get the shifts for the selected day of the week.
 * @param {{admin: *}} env
 * @param {{CLINICS: string, DOCTORS: string, SHIFTS: string}} globals
 * @param {{clinic: string, doctor: string, date: {year: number, month: number, day: number}}} params
 * @returns {Slot[]}
 */
async function getShiftSlots(env, globals, params) {
	const simpleDate = SimpleDate.fromObject(params.date);

	return await 
	env.admin.firestore()
	.collection(globals.CLINICS).doc(params.clinic)
	.collection(globals.DOCTORS).doc(params.doctor)
	.collection(globals.SHIFTS)
	.where("day", "==", simpleDate.weekday)
	.get().then(shift_snaps => {
		return shift_snaps.docs.map(shift_snap => {
			return new Slot(
				Time.fromObject(shift_snap.data().start),
				Time.fromObject(shift_snap.data().end)
			);
		});
	});
}

/**
 * Get the available time slots for making an appointment.
 * @param {Slot[]} shifts all the shifts of the day
 * @param {Slot[]} occupied existing appointments
 * @param {number} duration the length of the requested appointment in minutes
 * @returns Slot[]
 */
function getAvailableSlots(shifts, occupied, minimum, duration) {
	/**
	 * The available time slots
	 * @type {Slot[]}
	 */
	 const available = [];

	 // Find all available time slots within each shift:
	 for (const shift of shifts) {
		 // The size of each time slot should be duration. The start time of the slots should be incremented by minimum.
		 // This is to get all slots for the appointment type while keeping the appointments aligned with each other.
 
		 let current_slot = new Slot(shift.start, shift.start.incrementMinutes(duration));
 
		 while (shift.contains(current_slot)) {
			 // If the current time slot doesn't collide with the occupied time slots:
			 let collides = false;
 
			 for (const appointment of occupied) {
				 if (current_slot.collides(appointment)) {
					 collides = true;
					 break;
				 }
			 }
		 
			 if (!collides) {
				 available.push(current_slot);
			 }
 
			 // Increment both the start and end times by minimum to check the next time slot while keeping the size of the slot the same:
			 current_slot = new Slot(current_slot.start.incrementMinutes(minimum),
				 current_slot.end.incrementMinutes(minimum));
		 }
	 }
 
	 return available;
}

/**
 * Get all available time slots for the specified appointment type on a specified date.
 * This is one of the few functions that has to be on Cloud Functions to make sure that appointments are only made at correct times.
 * @param {{admin: *}} env
 * @param {{CLINICS: string, DOCTORS: string, APPOINTMENTS: string, TYPES: string, SHIFTS: string}} globals
 * @param {{clinic: string, doctor: string, date: {year: number, month: number, day: number}, type: string}} params
 * @return {Promise<Slot[]>} An array of available time slots.
 */
async function getAvailable(env, globals, params) {
	/**
	 * The minimum appointment duration in minutes.
	 */
	const minimum = await getMinimum(env, globals, params);

	params.minimum = minimum;

	/**
	 * The requested appointment duration in minutes.
	 */
	const duration = await getDuration(env, globals, params);

	/**
	 * Unavailable time slots.
	 */
	const occupied = await getOccupiedSlots(env, globals, params);

	/**
	 * The shifts for the selected day of the week.
	 */
	const shifts = await getShiftSlots(env, globals, params);

	return getAvailableSlots(shifts, occupied, minimum, duration);
}


/**
 * Get all available time slots for the specified appointment type on a specified date.
 * This is one of the few functions that has to be on Cloud Functions to make sure that appointments are only made at correct times.
 * @param {{admin: *}} env
 * @param {{CLINICS: string, DOCTORS: string, APPOINTMENTS: string, TYPES: string, SHIFTS: string}} globals
 * @param {{clinic: string, doctor: string, patient: string, date: {year: number, month: number, day: number}, time: firebase.firestore.Timestamp, timezoneOffset: number, type: string}} params
 * @return {Promise<Slot[]>} An array of available time slots.
 */
async function addAppointment(env, globals, params) {
	/**
	 * The minimum appointment duration in minutes.
	 */
	const minimum = await getMinimum(env, globals, params);

	params.minimum = minimum;

	/**
	 * The requested appointment duration in minutes.
	 */
	const duration = await getDuration(env, globals, params);

	/**
	 * Unavailable time slots.
	 */
	const occupied = await getOccupiedSlots(env, globals, params);

	/**
	 * The shifts for the selected day of the week.
	 */
	const shifts = await getShiftSlots(env, globals, params);

	/**
	 * The available time slots for making an appointment.
	 */
	const available = getAvailableSlots(shifts, occupied, minimum, duration);

	const time = Time.fromDate(params.time.toDate());
	const requestedSlot = new Slot(time, time.incrementMinutes(duration));

	for (const slot of available) {
		if (slot.start.compare(requestedSlot.start) === 0 && slot.end.compare(requestedSlot.end) === 0) {
			// If the requested appointment time slot is available and aligns with the spacing of the time slots in the schedule:

			return env.admin.firestore()
			.collection(globals.CLINICS).doc(params.clinic)
			.collection(globals.APPOINTMENTS)
			.add({
				patient: params.patient,
				doctor: params.doctor,
				clinic: params.clinic,
				start: requestedSlot.start.toDate(),
				end: requestedSlot.end.toDate(),
				offset: params.timezoneOffset,
				type: params.type
			});
		}
	}
}

/**
 * 
 * @param {functions.Change<functions.firestore.DocumentSnapshot>} change 
 * @param {functions.EventContext} context 
 */
async function verifyAppointment(change, context) {
	// Get an object with the previous document value (for update or delete)
	// If the document does not exist, it has been created (?).
	const oldDocument = change.before.exists ? change.before.data() : null;

	// Get an object with the current document value.
	// If the document does not exist, it has been deleted.
	const newDocument = change.after.exists ? change.after.data() : null;

	// On create: delete the appointment.
	// On update: revert the change.

	// There should be 3 verification statuses: 'new', 'updating', 'verified'.

	// Whenever an appointment is created it should be marked as "verified: 'new'".
	// Whenever an appointment is updated it should be marked as "verified: 'updating'".
	// If this function finds no problems then it should change the marking to "verified: 'verified'".

	// When the verification status is "new" then the appointment should not be considered booked.
	// When the verification status is "updating" then the appointment should be considered booked, but only on the old slot.
	// When the verification status is "verified" then the appointment should be considered booked.

	// So ideally new appointments would go to the appointments collection with a status of verified: false.
	// Then after verification it should change to verified: true.
	// For existing appointments updates would go to a staging collection and the document would have a status of verified: true, updating: true.
	// After verification the updated data would be written to the appointment and the status would be updated to updating: false.

	// Or when an update happens verify the new document, then revert the write if it fails verification.
	// Then the verified property would refer only to whether the data in the current document is verified.
	// Put in the security rules that create and update are only allowed if verified == false.

	// I think I'll go with this last approach for now, since it's the simplest.
	
	// On create or update:
	if (newDocument) {
		
		if (!newDocument.verified) {
			change.after.ref().update({
				verified: true
			});
		}

		// // Check if the appointment is valid, meaning that it doesn't collide with any existing appointment.
		// // If it is invalid, delete the appointment.
		// const simpleDate = new SimpleDate(newDocument.start.toDate());
		// console.log("Date: ", simpleDate);

		// const slot = new Slot(
		// 	Time.fromDate(newDocument.start.toDate()),
		// 	Time.fromDate(newDocument.end.toDate())
		// );
		
		// console.log("Time Slot: ", slot);

		// db.collection(CLINICS).doc(newDocument.clinic).collection(APPOINTMENTS)
		// .orderBy("start")
		// .where("start", ">=", fs.Timestamp.fromDate(simpleDate.toDate()))
		// .where("start", "<", fs.Timestamp.fromDate(simpleDate.getNextDay().toDate()))
		// .where("doctor", "==", newDocument.doctor)
		// .where("verified", "==", true)
		// .get().then(appointment_snaps => {
		// 	console.log("Results: ", appointment_snaps.size);
		// 	for (const appointment of appointment_snaps.docs) {
		// 		const app_slot = new Slot(
		// 			Time.fromDate(appointment.data().start.toDate()),
		// 			Time.fromDate(appointment.data().end.toDate()),
		// 		)
		// 		console.log();
		// 		// I don't need to check appointment.id !== context.params.appID because the security rules will require that verified == false, and the query requires verified == true.

		// 		// If the new appointment data causes a collision:
		// 		if (app_slot.collides(slot)) {

		// 			// If it's an update, revert the change:
		// 			if (oldDocument) {
		// 				const data = change.before.data();
		// 				data.verified = true;
		// 				change.before.ref.set(data);
		// 				return;
		// 			}

		// 			// If it's a new appointment, revert the change by deleting it:
		// 			change.after.ref.delete();
		// 			return;
		// 		}
		// 	}
		// });


		// let collides = false;

		// // Convenience variables:
		// const doctor = newDocument.doctor;
		// const clinic = newDocument.clinic;
		// const date = newDocument.start;
		// const simpleDate = SimpleDate.fromObject(date);
		// const slot = new Slot(
		// 	Time.fromDate(newDocument.start),
		// 	Time.fromDate(newDocument.end)
		// )

		// // Set the time range for the appointments to be exactly the day in question:
		// const start_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day));
		// const end_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day + 1));

		// // Get all the appointments in the clinic on the selected day:
		// return db.collection("clinic").doc(clinic).collection("appointments").orderBy("start")
		// .where("start", ">=", start_day)
		// .where("start", "<", end_day)
		// .where("doctor", "==", doctor)
		// .get().then(appointment_snaps => {
		// 	// Check for collisions with other appointments:
		// 	for (const appointment_snap of appointment_snaps.docs) {
		// 		// Exclude this appointment, since we don't care if the new time collides with the old time, only if it collides with other appointments:
		// 		if (appointment_snap.id !== context.params.appId) {
		// 			const other_slot = new Slot(
		// 				Time.fromDate(appointment_snap.data().start.toDate()),
		// 				Time.fromDate(appointment_snap.data().end.toDate())
		// 			);

		// 			if (other_slot.collides(slot)) {
		// 				collides = true;
		// 				break;
		// 			}
		// 		}
		// 	}

		// 	let inside = false;

		// 	// Get all the shifts during this day:
		// 	db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("shifts").get()
		// 	.then(shift_snaps => {
		// 		const day = [];

		// 		for (const shift_snap of shift_snaps.docs) {
		// 			if (shift_snap.data().day === simpleDate.weekday) {
		// 				day.push(new Slot(
		// 					Time.fromObject(shift_snap.data().start),
		// 					Time.fromObject(shift_snap.data().end)
		// 				))
		// 			}
		// 		}

		// 		for (const shift of day) {
		// 			// Check that this appointment is within the shift:
		// 			if (shift.contains(slot)) {
		// 				inside = true;
		// 				break;
		// 			}
		// 		}

		// 		if (collides || !inside) {
		// 			change.after.ref.delete()
		// 		}
		// 	});
		// });
	}
}

exports.verifyAppointment = verifyAppointment;
exports.getAvailable = getAvailable;