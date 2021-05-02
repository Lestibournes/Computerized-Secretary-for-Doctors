// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
const { SimpleDate } = require('./SimpleDate');
const { Slot } = require('./Slot');
const { Time } = require('./Time');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

const NAME = "schedules";

/*
The structure of the schedule document:
Fields:
	doctor: the id of the doctor
	clinic: the id of the clinic
Collections:
	shifts: a collection of shifts, each containing:
		day: the day of the week
		start: the start time
			hours
			minutes
		end: the end time
			hours
			minutes
		min: The minimum duration of an appointment, in minutes.
 */

/**
 * Get the complete schedule the specified doctor at the speciefied clinic.
 * @param {string} doctor the id of the doctor
 * @param {string} clinic the id of the clinic
 * @returns {Promise<{
 * day: number,
 * start: {
 * 	hours: number,
 * 	minutes: number
 * },
 * end: {
 * 	hours: number,
 * 	minutes: number
 * },
 * min:	number
 * }[][]>} The top level of the array represents the days of the week (0-6).
 * The second level the shifts within each day, with 1 slot object per shift.
 */
async function get(clinic, doctor) {
	return db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection(NAME).get()
	.then(shift_snaps => {
		const days = [];

		for (let i = 0; i < SimpleDate.day_names.length; i++) {
			days.push([]);
		}

		for (const shift of shift_snaps.docs) {
			const data = shift.data();
			data.id = shift.id;
			days[shift.data().day].push(data);
		}

		return days;
	});
}

/**
 * Add a new shift to the schedule of the doctor at the clinic.
 * @param {string} clinic the id of the clinic
 * @param {string} doctor the id of the doctor
 * @param {number} day The number of the day, 0-6.
 * @param {Time} start The start time of the shift
 * @param {Time} end The end time of the shift.
 * @param {number} min The minimum duration of an appointment, in minutes.
 * @returns 
 */
async function add(clinic, doctor, day, start, end, min) {
	return db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection(NAME).add({
	// return db.collection(NAME).doc(schedule).collection(NAME).add({
		day: day,
		start: start,
		end: end,
		min: min
	});
}

async function remove(clinic, doctor, shift) {
	return db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection(NAME).doc(shift).delete()
	.then(() => {
		return {
			success: true
		}
	})
	.catch(() => {
		return {
			success: false,
			message: "There was an error with deleting the shift."
		}
	});
}


exports.get = get;
exports.add = add;
exports.delete = remove;
exports.NAME = NAME;