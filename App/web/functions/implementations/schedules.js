const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
const { SimpleDate } = require('./SimpleDate');
const { Slot } = require('./Slot');
const { Time } = require('./Time');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const fsdb = admin.firestore();

const secretaries = require("./secretaries");
const doctors = require("./doctors");
const clinics = require("./clinics");
const permissions = require("./permissions");

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
 * Check if the current user is authorized to modify the given doctor's work schedule.
 * @param {string} clinic The id of the clinic
 * @param {string} doctor The id of the doctor
 * @param {functions.https.CallableContext} context The function call's execution context, which provides the current user's id.
 * @returns {Promise<boolean>}
 */
async function checkModifyPermission(clinic, doctor, context) {
	// If the current user is the owner:
	return clinics.isOwner(clinic, context.auth.uid).then(isOwner => {
		if (isOwner) return true;
		
		// If the current user is a secretary:
		return clinics.hasSecretary(clinic, context.auth.uid).then(secretary_exists => {
			if (secretary_exists) return true;

			// if the clinic has the doctor and he is the same as the current user:
			return fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).get().then(doctor_snapshot => {
				if (doctor_snapshot.exists && doctor === context.auth.uid) return true;

				// If the current user is neither the owner of the clinic, nor a secretary, nor the doctor that the shift belongs to:
				return false;
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
 * }[][]>} The top level of the array represents the days of the week (0-6).
 * The second level the shifts within each day, with 1 slot object per shift.
 */
async function get(clinic, doctor) {
	return fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection(NAME).get()
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
 * @param {functions.https.CallableContext} context The function call's execution context, which provides the current user's id.
 * @returns {Promise<{
 * 	success: boolean,
 * 	message: string
 * }>}
 */
async function add(clinic, doctor, day, start, end, context) {
	const response = {
		success: false,
		message: "",
	}

	return checkModifyPermission(clinic, doctor, context).then(allowed => {
		if (allowed) {
			return fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection(NAME).add({
				day: day,
				start: start,
				end: end,
			}).then(() => {
				response.success = true;
				return response;
			});
		}

		response.message = permissions.DENIED;
		return response;
	});
}

/**
 * Add a new shift to the schedule of the doctor at the clinic.
 * @param {string} clinic the id of the clinic
 * @param {string} doctor the id of the doctor
 * @param {string} shift The id of the shift that is being edited.
 * @param {number} day The number of the day, 0-6.
 * @param {Time} start The start time of the shift
 * @param {Time} end The end time of the shift.
 * @param {functions.https.CallableContext} context The function call's execution context, which provides the current user's id.
 * @returns {Promise<{
 * 	success: boolean,
 * 	message: string
 * }>}
 */
async function edit(clinic, doctor, shift, day, start, end, context) {
	const response = {
		success: false,
		message: "",
	}

	return checkModifyPermission(clinic, doctor, context).then(allowed => {
		if (allowed) {
			const shift_ref = fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection(NAME).doc(shift);
			
			return shift_ref.get().then(shift_snapshot => {
				if (shift_snapshot.exists) {
					const data = {};
				
					if (day) data.day = day;
					if (start) data.start = start;
					if (end) data.end = end;

					return shift_ref.update(data).then(() => {
						response.success = true;
						return response;
					});
				}

				response.message = "The shift does not exist";
				return response;
			});
		}

		response.message = permissions.DENIED;
		return response;
	});
}

/**
 * Add a new shift to the schedule of the doctor at the clinic.
 * @param {string} clinic the id of the clinic
 * @param {string} doctor the id of the doctor
 * @param {string} shift The id of the shift that is being edited.
 * @param {functions.https.CallableContext} context The function call's execution context, which provides the current user's id.
 * @returns {Promise<{
 * 	success: boolean,
 * 	message: string
 * }>}
 */
async function remove(clinic, doctor, shift, context) {
	const response = {
		success: false,
		message: "",
	}

	return checkModifyPermission(clinic, doctor, context).then(allowed => {
		if (allowed) {
			return fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection(NAME).doc(shift).delete()
			.then(() => {
				response.success = true;
				return response;
			})
			.catch(() => {
				response.message = "There was an error with deleting the shift";
				return response;
			});
		}

		response.message = permissions.DENIED;
		return response;
	});
}

/**
 * Add a new appointment type to the given doctor at the given clinic.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 * @param {string} name The display name of the appointment type.
 * @param {number} duration The integer multiplier of the minimum duration.
 * @param {functions.https.CallableContext} context The function call's execution context, which provides the current user's id.
 * @returns {Promise<{
 * 	success: boolean,
 * 	id: string,
 * 	message: string
 * }>} Whether or not the operations succeeded, the id of the new appointment type, and error messages.
 */
async function addType(clinic, doctor, name, duration, context) {
	const response = {
		success: false,
		id: null,
		name: name,
		duration: duration,
		message: ""
	};

	return checkModifyPermission(clinic, doctor, context).then(allowed => {
		if (allowed) {
			return fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("types")
			.add({
				name: name,
				duration: duration
			}).then(type_ref => {
				response.success = true;
				response.id = type_ref.id;

				return response;
			})
			.catch(() => {
				response.message = "There was an error with adding the appointment type";
				return response;
			})
		}

		// If the current user isn't allowed to add new appointment types to this doctor at this clinic,
		// i.e, if he's not the owner of the clinic, the owner of the doctor account, or a secretary working at the clinic:
		response.message = permissions.DENIED;
		return response;
	});
}

/**
 * Edit an exitsing appointment type of the given doctor at the given clinic.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 * @param {string} type The id of the appointment type.
 * @param {string} name The display name of the appointment type.
 * @param {number} duration The integer multiplier of the minimum duration.
 * @param {functions.https.CallableContext} context The function call's execution context, which provides the current user's id.
 * @returns {Promise<{
 * 	success: boolean,
 * 	id: string,
 * 	message: string
 * }>} Whether or not the operations succeeded, the id of the new appointment type, and error messages.
 */
async function editType(clinic, doctor, type, name, duration, context) {
	const response = {
		success: false,
		id: type,
		name: name,
		duration: duration,
		message: ""
	};

	return checkModifyPermission(clinic, doctor, context).then(allowed => {
		if (allowed) {
			const type_ref = fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("types").doc(type);
			return type_ref.get().then(type_snap => {
				if (type_snap.exists) {
					return type_ref.update({
						name: name,
						duration: duration
					}).then(() => {
						response.success = true;
						return response;
					}).catch(() => {
						response.message = "There was an error with editing the appointment type";
						return response;
					})
				}

				response.message = "The requested appointment type does not exist";
				return response;
			});
		}

		// If the current user isn't allowed to add new appointment types to this doctor at this clinic,
		// i.e, if he's not the owner of the clinic, the owner of the doctor account, or a secretary working at the clinic:
		response.message = permissions.DENIED;
		return response;
	});
}


/**
 * Delete an exitsing appointment type of the given doctor at the given clinic.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 * @param {string} type The id of the appointment type.
 * @param {functions.https.CallableContext} context The function call's execution context, which provides the current user's id.
 * @returns {Promise<{
 * 	success: boolean,
 * 	id: string,
 * 	message: string
 * }>} Whether or not the operations succeeded, the id of the new appointment type, and error messages.
 */
async function deleteType(clinic, doctor, type, context) {
	const response = {
		success: false,
		id: type,
		message: ""
	};

	return checkModifyPermission(clinic, doctor, context).then(allowed => {
		if (allowed) {
			const type_ref = fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("types").doc(type);
			return type_ref.get().then(type_snap => {
				if (type_snap.exists) {
					return type_ref.delete().then(() => {
						response.success = true;
						return response;
					}).catch(() => {
						response.message = "There was an error with deleting the appointment type";
						return response;
					})
				}

				response.message = "The requested appointment type does not exist";
				return response;
			});
		}

		// If the current user isn't allowed to add new appointment types to this doctor at this clinic,
		// i.e, if he's not the owner of the clinic, the owner of the doctor account, or a secretary working at the clinic:
		response.message = permissions.DENIED;
		return response;
	});
}

/**
 * Get all of the appointment types for the doctor at the clinic.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 * @returns {Promise<{
 * 	success: boolean,
 * 	types: {
 * 		name: string,
 * 		duration: number,
 * 		id: string
 * 	}[],
 * 	message: string
 * }>} Whether or not the data was successfully fetched, an array of the data and ids of all the appointment types, and error messages in case of failure.
 */
async function getTypes(clinic, doctor) {
	const response = {
		success: false,
		types: [],
		message: ""
	};

	return fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("types").get()
		.then(type_snaps => {
			for (const type_snap of type_snaps.docs) {
				const data = type_snap.data();
				data.id = type_snap.id;

				response.types.push(data);
			}

			response.success = true;
			return response;
		})
		.catch(() => {
			response.message = "There was an error fetching the appointment types";
			return response;
		});
}


/**
 * Get the data of the requested appointment type.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 * @param {string} type The case-insensitive name of the appointment type.
 * @returns {Promise<{
 * 	success: string,
 * 	message: string,
 * 	id: string,
 * 	name: string,
 * 	minimum: number,
 * 	duration: number,
 * 	minutes: number,
 * 	hue: number
 * }>}
 */
async function getType(clinic, doctor, type) {
	const response = {
		success: false,
		message: "",

		id: "",
		name: "",
		minimum: 0,
		duration: 0,
		minutes: 0,
		hue: 0,
	};

	return getMinimum(clinic, doctor).then(minimum_response => {
		if (minimum_response.success) {
			response.minimum = minimum_response.minimum;
			
			return getTypes(clinic, doctor).then(types_response => {
				for (const t of types_response.types) {
					if (t.name.toLowerCase() === type.toLowerCase()) {
						response.success = true;

						response.id = t.id;
						response.name = t.name;
						response.duration = t.duration;
						response.minutes = t.duration * minimum_response.minimum;
						response.hue = response.minutes % 360;

						return response;
					}
				}
	
				response.message = "The requested type was not found";
				return response;
			});
		}
		else {
			response.message = "There is no minimum appointment duration";
			return response;
		}
	})
}

/**
 * Set the minimum duration for appointments.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 * @param {number} minimum The minimum number of minutes for each appointment's time slot.
 * @param {functions.https.CallableContext} context The function call's execution context, which provides the current user's id.
 * @returns {Promise<{
 * 	success: boolean,
 * 	message: string
 * }>} Whether or not the operations succeeded and error messages.
 */
async function setMinimum(clinic, doctor, minimum, context) {
	const response = {
		success: false,
		message: ""
	};

	return checkModifyPermission(clinic, doctor, context).then(allowed => {
		if (allowed) {
			return fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).update({
				minimum: minimum
			}).then(() => {
				response.success = true;
				return response;
			})
			.catch(() => {
				response.message = "There was an error with setting the minimum appointment duration";
				return response;
			})
		}

		// If the current user isn't allowed to modify the minimum appointment duration of this doctor at this clinic,
		// i.e, if he's not the owner of the clinic, the owner of the doctor account, or a secretary working at the clinic:
		response.message = permissions.DENIED;
		return response;
	});
}


/**
 * Get the minimum duration for appointments.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 * @returns {Promise<{
 * 	success: boolean,
 * 	minimum: number,
 * 	message: string
 * }>} Whether or not the operations succeeded and error messages.
 */
async function getMinimum(clinic, doctor) {
	const response = {
		success: false,
		minimum: 0,
		message: ""
	};

	return fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).get().then(snap => {
		response.success = true;
		response.minimum = snap.data().minimum ? snap.data().minimum : 0;
		return response;
	})
	.catch(() => {
		response.message = "There was an error with getting the minimum appointment duration";
		return response;
	});
}

/**
 * Get the actual duration in minutes of the requested appointment type.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 * @param {string} type The case-insensitive name of the appointment type.
 * @returns {Promise<{
 * 	success: string,
 * 	message: string,
 * 	duration: number,
 * 	minimum: number
 * }>}
 */
async function getMinutes(clinic, doctor, type) {
	const response = {
		success: false,
		duration: 0,
		minimum: 0,
		message: ""
	};

	return getMinimum(clinic, doctor).then(minimum_response => {
		if (minimum_response.success) {
			response.minimum = minimum_response.minimum;

			return getTypes(clinic, doctor).then(types_response => {
				for (const t of types_response.types) {
					if (t.name.toLowerCase() === type.toLowerCase()) {
						response.success = true;
						response.duration = t.duration * minimum_response.minimum;
						return response;
					}
				}
	
				response.message = "The requested type was not found";
				return response;
			});
		}
		else {
			response.message = "There is no minimum appointment duration";
			return response;
		}
	})
}

exports.checkModifyPermission = checkModifyPermission;
exports.get = get;
exports.add = add;
exports.edit = edit;
exports.delete = remove;
exports.NAME = NAME;

exports.addType = addType;
exports.editType = editType;
exports.deleteType = deleteType;
exports.getTypes = getTypes;
exports.getType = getType;

exports.setMinimum = setMinimum;
exports.getMinimum = getMinimum;

exports.getMinutes = getMinutes;