// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

const functions = require('firebase-functions');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

const stringContains = require('./functions').stringContains;

const doctors = require("./doctors");
const clinics = require("./clinics");
const secretaries = require("./secretaries");

/**
 * Checks if the provided string can be used as part of a URL directory structure.
 * @param {string} directory 
 * @returns {boolean}
 */
function isValidName(directory) {
	return directory.match(/^[a-zA-Z0-9\-\_]+$/) !== null;
}

const NAME = "links";
const CLINIC = "clinic";
const DOCTOR = "doctor";

function checkPermission(type, id, context) {
	const response = {
		success: false,
		message: "",
		allowed: false
	};

	// Check if the type is valid and if the current user has the right permissions:
	if (type === CLINIC) {
		return clinics.get(id).then(clinic_data => {
			return doctors.getID(context.auth.uid).then(doctor_id => {
				if (doctor_id === clinic_data.owner) {
					response.success = true;
					response.allowed = true;
					return response;
				}
				
				return secretaries.getID(context.auth.uid).then(secretary_id => {
					return clinics.getAllSecretaries(id).then(secretaries_data => {
						for (const secretary of secretaries_data) {
							if (secretary.id === secretary_id) {
								response.success = true;
								response.allowed = true;
								return response;
							}
						}

						response.success = true;
						return response;
					});
				});
			})
		})
	}

	if (type === DOCTOR) {
		return doctors.getID(context.auth.uid).then(doctor_id => {
			if (id === doctor_id) {
				response.success = true;
				response.allowed = true;
				return response;
			}
			
			response.success = true;
			return response;
		})
	}

	response.message = "Invalid type";
	return response;
}

/**
 * Check if the given string is available for use as a link name.
 * @param {string} name the link
 * @returns {boolean}
 */
function isAvailable(name) {
	return db.collection(NAME).doc(name).get().then(link_snap => {
		return !link_snap.exists;
	});
}

/**
 * Register a new link.
 * @param {string} name The requested link. Needs to be a valid directory name in a URL.
 * @param {string} type Whether it's a clinic or a doctor.
 * @param {string} id The id of the clinic or doctor to be linked.
 * @param {functions.https.CallableContext} context
 * @returns 
 */
function register(name, type, id, context) {
	const response = {
		success: false,
		message: ""
	};

	// Check that the parameters are valid.

	// Check if the name for the link is valid:
	if (!isValidName(name)) {
		response.message("Invalid name");
		return response;
	}

	// Check if the type is valid and if the current user has the right permissions:
	if (type !== CLINIC && type !== DOCTOR) {
		response.message = "Invalid type";
		return response;
	}

	// Check if the current use has permission:
	return checkPermission(type, id, context).then(permission => {
		if (permission.success && permission.allowed) {
			// Check if the name is available:
			return isAvailable(name).then(available => {
				if (available) {
					return getLink(type, id).then(response => {
						// If the clinic/doctor already has a link, delete it:
						if (response.success) {
							// Register the new link:
							return db.collection(NAME).doc(name).delete().then(() => {
								return db.collection(NAME).doc(name).set({
									type: type,
									id: id
								}).then(() => {
									if (type === DOCTOR) {
										return db.collection("doctors").doc(id).update({link: name}).then(() => {
											response.success = true;
											return response;
										});
									}

									return db.collection("clinics").doc(id).update({link: name}).then(() => {
										response.success = true;
										return response;
									});
								}) 
							})
						}
		
						// If the doctor/clinic doesn't have a link, register a new one directly:
						return db.collection(NAME).doc(name).set({
							type: type,
							id: id
						}).then(() => {
							if (type === DOCTOR) {
								return db.collection("doctors").doc(id).update({link: name}).then(() => {
									response.success = true;
									return response;
								});
							}

							return db.collection("clinics").doc(id).update({link: name}).then(() => {
								response.success = true;
								return response;
							});
						})
					});
				}
		
				response.message = "Requested link is already taken";
				return response;
			});
		}

		if (!permission.success) {
			response.message = permission.message;
			return response;
		}

		response.message = "You do not have permission to modify this doctor's links";
		return response;
	});
}

/**
 * 
 * @param {string} type The type of object (doctor or clinic) who's link is bieng sought.
 * @param {string} id The id of the doctor or clinic who's link is being sought.
 * @returns {{
 * success: boolean,
 * message: string,
 * link: string
 * }} The resule of the operation: whether it was successful, ther error message if it was not, and the requested data (the link name) if it was retrieved.
 */
function getLink(type, id) {
	const response = {
		success: false,
		message: "",
		link: ""
	};

	if (type === CLINIC) {
		return clinics.get(id).then(clinic_data => {
			if (clinic_data.link) {
				response.success = true;
				response.link = clinic_data.link;
			}
			else {
				response.message = "The clinic does not have a link";
			}

			return response;
		});
	}
	else if (type === DOCTOR) {
		return doctors.getData(id).then(doctor_data => {
			if (doctor_data.doctor.link) {
				response.success = true;
				response.link = doctor_data.doctor.link
			}
			else {
				response.message = "The doctor does not have a link";
			}

			return response;
		})
	}
	
	response.message = "Invalid type";
	return response;
}

function getTarget(name) {
	const response = {
		success: false,
		message: "",
		target: null
	}

	return db.collection(NAME).doc(name).get().then(link_snap => {
		if (!link_snap.exists) {
			response.message = "The requested link does not exist";
			return response;
		}

		response.success = true;
		response.target = link_snap.data();
		return response;
	})
}

exports.isAvailable = isAvailable;
exports.register = register;
exports.getLink = getLink;
exports.getTarget = getTarget;