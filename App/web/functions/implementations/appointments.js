const functions = require('firebase-functions');
const fs = require("@google-cloud/firestore");

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const fsdb = admin.firestore();

const clinics = require("./clinics");
const schedules = require("./schedules");

const CLINICS = "clinics";
const DOCTORS = "doctors"
const APPOINTMENTS = "appointments";
const TYPES = "types";

/**
 * @todo Make the 2 classes files identical and get rid of the redundancy:
 */

const Time = require("./Time").Time;
const Slot = require("./Slot").Slot;
const SimpleDate = require("./SimpleDate").SimpleDate;

/**
 * Get all available time slots for a specified date.
 * If appointment type is specified then it will get only time slots that are big enough to accomodate it.
 * This is one of the few functions that has to be on Cloud Functions to make sure that appointments are only made at correct times.
 * @todo use the Time, Slot, and SimpleDate classes and methods instead of ad-hoc objects and global functions.
 * @param {string} doctor The id of the doctor.
 * @param {string} clinic The id of the clinic.
 * @param {Date} date The date for which available appointments are being queried.
 * @param {string} type The type of appointment.
 * @return {Slot[]} An array of available time slots.
 */
async function getAvailable(clinic, doctor, date, type) {
	const doctorRef = fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor);

	/**
	 * The minimum appointment duration in minutes.
	 * @type {number}
	 */
	const minimum = await doctorRef.get().then(doctor_snap => {
		return doctor_snap.data().minimum;
	});

	// The different appointment types with their durations.
	/**
	 * @type {Map<string, number>}
	 */
	const types = await doctorRef.collection(TYPES).get().then(type_snaps => {
		const types = new Map();

		for (const type of type_snaps.docs) {
			if (type.data().name) types.set(type.data().name, type.data().duration);
		}

		return types;
	});

	/**
	 * The duration of the selected appointment type.
	 * @type {number}
	 */
	const duration = types.get(type) * minimum;

	/**
	 * The date for which available appoinetment slots are being fetched.
	 * @type {SimpleDate}
	 */
	const simpleDate = new SimpleDate(date);

	// Set the time range for the appointments to be exactly the day in question:
	const start_day = fs.Timestamp.fromDate(simpleDate.toDate());
	const end_day = fs.Timestamp.fromDate(simpleDate.getNextDay().toDate());
	
	// Get all of the booked time ranges:
	const appointments = await fsdb.collection(CLINICS).doc(clinic).collection(APPOINTMENTS)
	.orderBy("start")
	.where("start", ">=", start_day)
	.where("start", "<", end_day)
	.where("doctor", "==", doctor)
	.get().then(appointment_snaps => {
		const appointments = [];

		for (const appointment_snap of appointment_snaps.docs) {
			const start_time = Time.fromDate(appointment_snap.data().start.toDate());
			const end_time = start_time.incrementMinutes(minimum * types.get(appointment_snap.data().type));

			appointments.push(new Slot(start_time, end_time));
		}

		return appointments;
	});

	// console.log(appointments);

	// Get the shift schedule for the day:
	return doctorRef.collection("shifts").get().then(shift_snaps => {
	/**
	 * The available time slots
	 * @type {Slot[]}
	 */
	const available = [];

		/**
		 * The shifts for the selected day of the week.
		 * @type {Slot[]}
		 */
		const day = [];

		for (const shift_snap of shift_snaps.docs) {
			if (shift_snap.data().day === simpleDate.weekday) {
				day.push(new Slot(
					Time.fromObject(shift_snap.data().start),
					Time.fromObject(shift_snap.data().end)
				));
			}
		}

		// Find all available time slots within each shift:
		for (const shift of day) {
			// The size of each time slot should be duration. The start time of the slots should be incremented by minimum.
			// This is to get all slots for the appointment type while keeping the appointments aligned with each other.

			let current_slot = new Slot(shift.start, shift.start.incrementMinutes(duration));

			while (shift.contains(current_slot)) {
				// If the current time slot doesn't collide with the occupied time slots:
				let collides = false;

				for (const appointment of appointments) {
					console.log(current_slot, appointment)
					if (current_slot.collides(appointment)) {
						collides = true;
						break;
					}
				}
			
				if (!collides) available.push(current_slot);

				// Increment both the start and end times by minimum to check the next time slot while keeping the size of the slot the same:
				current_slot = new Slot(current_slot.start.incrementMinutes(minimum),
					current_slot.end.incrementMinutes(minimum));
			}
		}

		return available;
	});
}

exports.getAvailable = getAvailable;