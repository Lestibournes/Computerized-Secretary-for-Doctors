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
//  * @param {{CLINICS: string, APPOINTMENTS: string, TYPES: string}} strings
//  * @param {{clinic: string, doctor: string, date: {year: number, month: number, day: number}, type: string}} params
//  * @return {Promise<Slot[]>} An array of available time slots.
//  */
// async function getAvailable(env, strings, params) {
// 	const db = env.admin.firestore();
// 	const {CLINICS, APPOINTMENTS, TYPES} = {...strings};
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
 * @param {{CLINICS: string, DOCTORS: string}} strings
 * @param {{clinic: string, doctor: string}} params
 * @returns {number}
 */
async function getMinimum(env, strings, params) {
	return await
	env.admin.firestore()
	.collection(strings.CLINICS).doc(params.clinic)
	.collection(strings.DOCTORS).doc(params.doctor)
	.get().then(doctor_snap => {
		return doctor_snap.data().minimum;
	});
}

/**
 * The requested appointment duration in minutes.
 * @param {{admin: *}} env
 * @param {{CLINICS: string, DOCTORS: string, TYPES: string}} strings
 * @param {{clinic: string, doctor: string, type: string, minimum: number}} params
 * @returns {number}
 */
async function getDuration(env, strings, params) {
	return await 
	env.admin.firestore()
	.collection(strings.CLINICS).doc(params.clinic)
	.collection(strings.DOCTORS).doc(params.doctor)
	.collection(strings.TYPES)
	.get().then(type_snaps => {
		for (const type_snap of type_snaps.docs) {
			if (type_snap.data().name === params.type) return type_snap.data().duration * params.minimum;
		}
	});
}

/**
 * Get all of the booked time ranges for the requested date
 * @param {{admin: *}} env
 * @param {{CLINICS: string, APPOINTMENTS: string}} strings
 * @param {{clinic: string, doctor: string}} params
 * @returns {Slot[]}
 */
async function getOccupiedSlots(env, strings, params) {
	const simpleDate = SimpleDate.fromObject(params.date);

	return await 
	env.admin.firestore()
	.collection(strings.CLINICS).doc(params.clinic)
	.collection(strings.APPOINTMENTS)
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
 * @param {{CLINICS: string, DOCTORS: string, SHIFTS: string}} strings
 * @param {{clinic: string, doctor: string, date: {year: number, month: number, day: number}}} params
 * @returns {Slot[]}
 */
async function getShiftSlots(env, strings, params) {
	const simpleDate = SimpleDate.fromObject(params.date);

	return await 
	env.admin.firestore()
	.collection(strings.CLINICS).doc(params.clinic)
	.collection(strings.DOCTORS).doc(params.doctor)
	.collection(strings.SHIFTS)
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
 * @param {{CLINICS: string, DOCTORS: string, APPOINTMENTS: string, TYPES: string, SHIFTS: string}} strings
 * @param {{clinic: string, doctor: string, date: {year: number, month: number, day: number}, type: string}} params
 * @return {Promise<Slot[]>} An array of available time slots.
 */
async function getAvailable(env, strings, params) {
	/**
	 * The minimum appointment duration in minutes.
	 */
	const minimum = await getMinimum(env, strings, params);

	params.minimum = minimum;

	/**
	 * The requested appointment duration in minutes.
	 */
	const duration = await getDuration(env, strings, params);

	/**
	 * Unavailable time slots.
	 */
	const occupied = await getOccupiedSlots(env, strings, params);

	/**
	 * The shifts for the selected day of the week.
	 */
	const shifts = await getShiftSlots(env, strings, params);

	return getAvailableSlots(shifts, occupied, minimum, duration);
}

/**
 * Create a new appointment for the given user (should be the current user in production)
 * This is one of the few functions that has to be on Cloud Functions to make sure that appointments are only made at correct times.
 * @param {{admin: *}} env
 * @param {{CLINICS: string, DOCTORS: string, APPOINTMENTS: string, TYPES: string, SHIFTS: string}} strings
 * @param {{clinic: string, doctor: string, patient: string, date: {year: number, month: number, day: number}, time: firebase.firestore.Timestamp, offset: number, type: string}} params
 * @return {Promise<string>}
 */
async function addAppointment(env, strings, params) {
	/**
	 * The minimum appointment duration in minutes.
	 */
	const minimum = await getMinimum(env, strings, params);

	params.minimum = minimum;

	/**
	 * The requested appointment duration in minutes.
	 */
	const duration = await getDuration(env, strings, params);

	/**
	 * Unavailable time slots.
	 */
	const occupied = await getOccupiedSlots(env, strings, params);

	/**
	 * The shifts for the selected day of the week.
	 */
	const shifts = await getShiftSlots(env, strings, params);

	/**
	 * The available time slots for making an appointment.
	 */
	const available = getAvailableSlots(shifts, occupied, minimum, duration);

	const time = Time.fromDate(params.time.toDate());
	const localTime = time.incrementMinutes(-params.offset);
	const requestedSlot = new Slot(localTime, localTime.incrementMinutes(duration));

	
	for (const slot of available) {
		if (slot.start.compare(requestedSlot.start) === 0 && slot.end.compare(requestedSlot.end) === 0) {
			// If the requested appointment time slot is available and aligns with the spacing of the time slots in the schedule:
			
			const endTime = time.incrementMinutes(duration);

			const app_ref = await env.admin.firestore()
			.collection(strings.CLINICS).doc(params.clinic)
			.collection(strings.APPOINTMENTS)
			.add({
				patient: params.patient,
				doctor: params.doctor,
				clinic: params.clinic,
				start: new Date(params.date.year, params.date.month, params.date.day, time.hours, time.minutes),
				end: new Date(params.date.year, params.date.month, params.date.day, endTime.hours, endTime.minutes),
				offset: params.offset,
				type: params.type
			});

			return app_ref.id;
		}
	}
}

/**
 * Create a new appointment for the given user (should be the current user in production)
 * This is one of the few functions that has to be on Cloud Functions to make sure that appointments are only made at correct times.
 * @param {{admin: *}} env
 * @param {{CLINICS: string, DOCTORS: string, APPOINTMENTS: string, TYPES: string, SHIFTS: string}} strings
 * @param {{clinic: string, doctor: string, patient: string, appointment: string, date: {year: number, month: number, day: number}, time: firebase.firestore.Timestamp, offset: number, type: string}} params
 * @return {Promise<string>}
 */
 async function updateAppointment(env, strings, params) {
	/**
	 * The minimum appointment duration in minutes.
	 */
	const minimum = await getMinimum(env, strings, params);

	params.minimum = minimum;

	/**
	 * The requested appointment duration in minutes.
	 */
	const duration = await getDuration(env, strings, params);

	/**
	 * Unavailable time slots.
	 */
	const occupied = await getOccupiedSlots(env, strings, params);

	/**
	 * The shifts for the selected day of the week.
	 */
	const shifts = await getShiftSlots(env, strings, params);

	/**
	 * The available time slots for making an appointment.
	 */
	const available = getAvailableSlots(shifts, occupied, minimum, duration);

	const time = Time.fromDate(params.time.toDate());
	const localTime = time.incrementMinutes(-params.offset);
	const requestedSlot = new Slot(localTime, localTime.incrementMinutes(duration));

	
	for (const slot of available) {
		if (slot.start.compare(requestedSlot.start) === 0 && slot.end.compare(requestedSlot.end) === 0) {
			// If the requested appointment time slot is available and aligns with the spacing of the time slots in the schedule:
			
			const endTime = time.incrementMinutes(duration);

			const app_ref = await env.admin.firestore()
			.collection(strings.CLINICS).doc(params.clinic)
			.collection(strings.APPOINTMENTS).doc(appointment)
			.update({
				start: new Date(params.date.year, params.date.month, params.date.day, time.hours, time.minutes),
				end: new Date(params.date.year, params.date.month, params.date.day, endTime.hours, endTime.minutes),
				offset: params.offset,
				type: params.type
			});

			return app_ref.id;
		}
	}
}

exports.getAvailable = getAvailable;
exports.addAppointment = addAppointment;
exports.updateAppointment = updateAppointment;