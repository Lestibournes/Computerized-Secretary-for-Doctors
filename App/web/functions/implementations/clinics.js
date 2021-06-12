// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
const functions = require('firebase-functions');

const users = require("./users");
const permissions = require("./permissions");
const doctors = require('./doctors');
const secretaries = require('./secretaries');
const appointments = require("./appointments");
const { capitalizeAll } = require('./functions');
const { SimpleDate } = require('./SimpleDate');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const fsdb = admin.firestore();

/**
 * Get the data of a specific clinic.
 * @param {string} id the id of the requested clinic.
 * @returns the data of the requested clinic.
 */
async function get(id) {
	return fsdb.collection("clinics").doc(id).get().then(clinic_snap => {
		const clinic = clinic_snap.data();
		clinic.id = clinic_snap.id;

		return clinic;
	});
}

/**
 * Create a new clinic.
 * @param {string} doctor The id of the doctor that the clinic will belong to.
 * @param {string} name The name of the clinic.
 * @param {string} city The city where the clinic is located.
 * @param {string} address The street and building number where the clinic is located.
 */
async function add(doctor, name, city, address) {
	return fsdb.collection("clinics").add({
		name: name,
		city: city,
		address: address,
		owner: doctor
	}).then(clinicRef => {
		return clinicRef.collection("doctors").doc(doctor).set({exists: true}).then(() => {
			return fsdb.collection("doctors").doc(doctor).collection("clinics").doc(clinicRef.id).set({exists: true}).then(() => {
				return fsdb.collection("cities").doc(city).set({exists: true}).then(() => {
					return fsdb.collection("cities").doc(city).collection("clinics").doc(clinicRef.id).set({exists: true}).then(() => {
						return clinicRef.id;
					});
				});
			});
		});
	});
}

/**
 * Edit the details of an existing clinic.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The doctor who is requesting the change.
 * @param {string} name The new name of the clinic.
 * @param {string} city The new city where the clinic is located.
 * @param {string} address The new street name and building number where the clinic is located.
 * @returns {Promise<{success: boolean, message: string}>} whether the operation succeeded, and if not, why not.
 */
async function edit(clinic, name, city, address, context) {
	const response = {
		success: false,
		message: ""
	};

	return permissions.checkPermission(permissions.CLINIC, permissions.MODIFY, clinic, context).then(allowed => {
		if (allowed) {
			return fsdb.collection("clinics").doc(clinic).update({
				name: name,
				city: city,
				address: address
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
 * Delete a clinic.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The doctor who is requesting the change.
 * @returns {Promise<{success: boolean, message: string}>} whether the operation succeeded, and if not, why not.
 */
async function eliminate(clinic, context) {
	return fsdb.collection("clinics").doc(clinic).get().then(clinic_snap => {
		const response = {
			success: false,
			message: ""
		};

		return permissions.checkPermission(permissions.CLINIC, permissions.MODIFY, clinic, clinic, context).then(allowed => {
			if (allowed) {
				const promises = [];

				// Go over all of the clinic's doctors and remove the clinic from their profile:
				promises.push(fsdb.collection("clinics").doc(clinic).collection("doctors").get().then(doctor_snaps => {
					const doctor_promises = [];
	
					for (const doctor_snap of doctor_snaps.docs) {
						doctor_promises.push(
							fsdb.collection("doctors").doc(doctor_snap.id).collection("clinics").doc(clinic).delete()
						);
	
						doctor_promises.push(
							fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor_snap.id).delete()
						);
					}
	
					return Promise.all(doctor_promises).then(() => {
						return true;
					});
				}));
	
				// Go over all of the clinic's secretaries and remove the clinic from their profile:
				promises.push(fsdb.collection("clinics").doc(clinic).collection("secretaries").get().then(secretary_snaps => {
					const secretary_promises = [];
	
					for (const secretary_snap of secretary_snaps.docs) {
						secretary_promises.push(
							fsdb.collection("secretaries").doc(secretary_snap.id).collection("clinics").doc(clinic).delete()
						);
	
						secretary_promises.push(
							fsdb.collection("clinics").doc(clinic).collection("secretaries").doc(secretary_snap.id).delete()
						);
					}
	
					return Promise.all(secretary_promises).then(() => {
						return true;
					});
				}));
				
				// Delete the clinic:
				promises.push(fsdb.collection("clinics").doc(clinic).delete());
	
				// Remove the clinic from the city:
				promises.push(
					fsdb.collection("cities").doc(clinic_snap.data().city).collection("clinics").doc(clinic).delete()
				);
	
				return Promise.all(promises).then(results => {
					response.success = true;
	
					for (const result of results) {
						if (!result) response.success = false;
					}
	
					return response;
				});
			}

			response.message = permissions.DENIED;
			return response;
		});
	});
}

/**
 * Get all the doctors who work in the given clinic.
 * @param {string} clinic The id of the clinic.
 * @returns {Promise<{doctor: object, user: object, clinics: object[], fields: string[]}[]>} The data of the requested doctors.
 */
 async function getAllDoctors(clinic) {
	return fsdb.collection("clinics").doc(clinic).collection("doctors").get().then(doctor_snaps => {
		const promises = [];

		for (const doctor of doctor_snaps.docs) {
			promises.push(doctors.getData(doctor.id));
		}

		return Promise.all(promises);
	});
}

/**
 * Add a doctor to a clinic.
 * @param {string} clinic The id of the clinic.
 * @param {string} requester The doctor who is requesting the change.
 * @param {string} doctor The doctor one wishes to add.
 * @returns {Promise<{success: boolean, message: string}>} whether the operation succeeded, and if not, why not.
 */
async function addDoctor(clinic, requester, doctor) {
	return fsdb.collection("clinics").doc(clinic).get().then(clinic_snap => {
		const response = {
			success: false,
			message: ""
		};

		if (clinic_snap.data().owner === requester || doctor === requester) {
			return fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).set({exists: true}).then(() => {
				return fsdb.collection("doctors").doc(doctor).collection("clinics").doc(clinic).set({exists: true}).then(() => {
					response.success = true;
					return response;
				})
			})
		}

		response.message = permissions.DENIED;
		return response;
	});
}

/**
 * Have a doctor leave a clinic in which he works (does not change ownership of the clinic).
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 */
 async function removeDoctor(clinic, requester, doctor) {
	return fsdb.collection("clinics").doc(clinic).get().then(clinic_snap => {
		const response = {
			success: false,
			message: ""
		};

		if (clinic_snap.data().owner === requester || doctor === requester) {
			fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).delete().then(() => {
				fsdb.collection("doctors").doc(doctor).collection("clinics").doc(clinic).delete().then(() => {
					response.success = true;
					return response;
				});
			});
		}

		response.message = permissions.DENIED;
		return response;
	});
}

/**
 * Get all the secretaries who work in the given clinic.
 * @param {string} clinic The id of the clinic.
 * @returns {Promise<{
 * 	id: string,
 * 	fullName: string,
 * 	sex: string,
 * 	clinics: object[],
 * 	data: object,
 * 	user: object
 * }[]>} The data of the requested secretaries.
 */
 async function getAllSecretaries(clinic) {
	return fsdb.collection("clinics").doc(clinic).collection("secretaries").get().then(secretary_snaps => {
		const promises = [];

		for (const secretary of secretary_snaps.docs) {
			promises.push(secretaries.getData(secretary.id));
		}

		return Promise.all(promises);
	});
}

/**
 * Add a secretary to a clinic.
 * @param {string} clinic The id of the clinic.
 * @param {string} requester The profile who is requesting the change
 * (either the owner's doctor profile or the employee's secretary profile)
 * @param {string} secretary The secretary one wishes to add.
 * @returns {Promise<{success: boolean, message: string}>} whether the operation succeeded, and if not, why not.
 */
async function addSecretary(clinic, requester, secretary) {
	return fsdb.collection("clinics").doc(clinic).get().then(clinic_snap => {
		const response = {
			success: false,
			message: ""
		};

		if (clinic_snap.data().owner === requester || secretary === requester) {
			return fsdb.collection("clinics").doc(clinic).collection("secretaries").doc(secretary).set({exists: true}).then(() => {
				return fsdb.collection("secretaries").doc(secretary).collection("clinics").doc(clinic).set({exists: true}).then(() => {
					response.success = true;
					return response;
				})
			})
		}

		response.message = permissions.DENIED;
		return response;
	});
}

/**
 * Have a secretary leave a clinic in which he works (does not change ownership of the clinic).
 * @param {string} clinic The id of the clinic.
 * @param {string} secretary The id of the secretary.
 */
async function removeSecretary(clinic, secretary, context) {
	const response = {
		success: false,
		message: ""
	};

	// Check if the current user is the owner of the clinic:
	// Check if the current user is the secretary being removed:
	return isOwner(clinic, context.auth.uid).then(isOwner => {
		if (isOwner || context.auth.uid === secretary) {
			return fsdb.collection("clinics").doc(clinic).collection("secretaries").doc(secretary).delete().then(() => {
				return fsdb.collection("secretaries").doc(secretary).collection("clinics").doc(clinic).delete().then(() => {
					response.success = true;
					return response;
				});
			});
		}

		response.message = permissions.DENIED;
		return response;
	});
}

/**
 * Check whether the given clinic has the given secretary.
 * @param {string} clinic The id of the clinic
 * @param {string} secretary The id of the secretary
 * @returns {Promise<boolean>}
 */
async function hasSecretary(clinic, secretary) {
	if (!secretary) return false;

	return fsdb.collection("clinics").doc(clinic).collection("secretaries").doc(secretary).get().then(secretary_snapshot => {
		return secretary_snapshot.exists;
	});
}

/**
 * Check whether the given doctor is the owner of the given clinic.
 * @param {string} clinic The id of the clinic
 * @param {string} doctor The id of the doctor.
 * @returns {Promise<boolean>}
 */
 async function isOwner(clinic, doctor) {
	return fsdb.collection("clinics").doc(clinic).get().then(clinic_snapshot => {
		return doctor === clinic_snapshot.data().owner;
	});
}

/**
 * Get the ids and display names of all the cities that have clinics.
 * @returns {Promise<{id: string, label: string}[]>} the ids and display names of all the cities.
 */
async function getAllCities() {
	return fsdb.collection("cities").get().then(city_snaps => {
		let cities = [];
		
		for (const city_snap of city_snaps.docs) {
			cities.push({
				id: city_snap.id,
				label: capitalizeAll(city_snap.id)
			});
		}
		
		return cities;
	});
}

/**
 * Get all of the appointments of all the doctors of the specified clinic within the specified time range.
 * Start and end times are optional. If they are not specified then there will not be a limit on start and end times.
 * @param {{clinic: string, doctor: string, start: Date, end: Date, context: functions.https.CallableContext}} constraints
 * @returns {Promise<{
 * success: boolean,
 * message: string,
 * data: object[]
 * }>} Whether the data was successfully retrieved, an error message if not, and the appointment data in an array.
 */
async function getAppointments({clinic, doctor, start, end, context}) {
	const response = {
		success: false,
		message: "",
		data: []
	}

	return permissions.checkPermission(permissions.CLINIC, permissions.VIEW, clinic, context).then(allowed => {
		if (allowed) {
			// Get all the doctors in the clinic:
			return fsdb.collection("clinics").doc(clinic).collection("doctors").get().then(doctor_snapshots => {
				let doctor_promises = [];
		
				for (const doctor_snapshot of doctor_snapshots.docs) {
					// If it's the doctor we want, or if we want all the doctors:
					if ((doctor && doctor_snapshot.id === doctor) || !doctor) {
						// Get that doctor's appointments and filter by specified date range if specified:
						let query = fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor_snapshot.id).collection("appointments");
						const startDate = admin.firestore.Timestamp.fromDate(SimpleDate.fromObject(start).toDate());
						const endDate = admin.firestore.Timestamp.fromDate(SimpleDate.fromObject(end).toDate());
			
						if (start || end ) query = query.orderBy("start");
						if (start) query = query.startAt(startDate);
						if (end) query = query.endAt(endDate);
		
						// Parallelize the fetching of the appointments by doctor:
						doctor_promises.push(query.get().then(querySnapshot => {
							const appointment_promises = [];
		
							// Fetch the data of each appointment (parallelized):
							for (const snap of querySnapshot.docs) {
								appointment_promises.push(appointments.get(snap.id, context));
							}
		
							// Put together and return a list of all of the appointments that were successfully fetched:
							return Promise.all(appointment_promises).then(results => {
								const appointments = [];
			
								for (const result of results) {
									if (result.success) appointments.push(result.data);
								}
			
								// Array of the doctor's appointments:
								return appointments;
							});
						}));
					}
				}

				// When done, aggregate and sort the results:
				return Promise.all(doctor_promises).then(results => {
					for (const result of results) {
						response.data = response.data.concat(result);
					}
		
					response.data.sort((a, b) => {
						return a.appointment.start > b.appointment.start ? 1 : a.appointment.start < b.appointment.start ? -1 : 0;
					});
		
					// /**@todo a more nuanced response  */
					// if (response.data.length > 0) {
						response.success = true;
					// }
					// else {
					// 	response.message = "No appointments found";
					// }
		
					// Array of arrays of the appointments of each doctor:
					return response;
				});
			});
		}
		else {
			response.message = permissions.DENIED;
			return response;
		}
	});
}


exports.get = get;
exports.add = add;
exports.edit = edit;
exports.delete = eliminate;

exports.getAllDoctors = getAllDoctors;
exports.addDoctor = addDoctor;
exports.removeDoctor = removeDoctor;
exports.isOwner = isOwner;

exports.getAllSecretaries = getAllSecretaries;
exports.addSecretary = addSecretary;
exports.removeSecretary = removeSecretary;
exports.hasSecretary = hasSecretary;

exports.getAllCities = getAllCities;

exports.getAppointments = getAppointments;