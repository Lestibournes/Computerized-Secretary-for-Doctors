const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
const { SimpleDate } = require('./SimpleDate');
const { Slot } = require('./Slot');
const { Time } = require('./Time');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

const secretaries = require("./secretaries");
const doctors = require("./doctors");
const clinics = require("./clinics");

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
 * Check if the current user is authorized to modify the given doctor's shifts.
 * @param {string} clinic The id of the clinic
 * @param {string} doctor The id of the doctor
 * @param {functions.https.CallableContext} context The function call's execution context, which provides the current user's id.
 * @returns {Promise<boolean>}
 */
async function checkModifyPermission(clinic, doctor, context) {
	// If the current user is the owner:
	return doctors.getID(context.auth.uid).then(doctor_id => {
		return clinics.isOwner(clinic, doctor_id).then(isOwner => {
			if (isOwner) return true;
			
			// If the current user is a secretary:
			return secretaries.getID(context.auth.uid).then(secretary_id => {
				return clinics.hasSecretary(clinic, secretary_id).then(secretary_exists => {
					if (secretary_exists) return true;

					// if the clinic has the doctor and he is the same as the current user:
					return db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).get().then(doctor_snapshot => {
						if (doctor_snapshot.exists && doctor === doctor_id) return true;

						// If the current user is neither the owner of the clinic, nor a secretary, nor the doctor that the shift belongs to:
						return false;
					});
				});
			});
		});
	});
}

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
		day: day,
		start: start,
		end: end,
		min: min
	});
}

/**
 * Add a new shift to the schedule of the doctor at the clinic.
 * @param {string} shift The id of the shift that is being edited.
 * @param {string} clinic the id of the clinic
 * @param {string} doctor the id of the doctor
 * @param {number} day The number of the day, 0-6.
 * @param {Time} start The start time of the shift
 * @param {Time} end The end time of the shift.
 * @param {number} min The minimum duration of an appointment, in minutes.
 * @returns 
 */
async function edit(shift, clinic, doctor, day, start, end, min, context) {
	const response = {
		success: false,
		message: "",
	}

	return checkModifyPermission(clinic, doctor, context).then(allowed => {
		console.log("allowed: " + allowed);
		if (allowed) {
			const shift_ref = db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection(NAME).doc(shift);
			
			return shift_ref.get().then(shift_snapshot => {
				if (shift_snapshot.exists) {
					const data = {};
				
					if (day) data.day = day;
					if (start) data.start = start;
					if (end) data.end = end;
					if (min) data.min = min;

					return shift_ref.update(data).then(() => {
						response.success = true;
						return response;
					});
				}

				response.message = "The shift does not exist";
				return response;
			});
		}

		response.message = "You are not authorized to perform this action";
		return response;
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
exports.edit = edit;
exports.delete = remove;
exports.NAME = NAME;