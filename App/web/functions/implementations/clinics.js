// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

const doctors = require('./doctors');
const { capitalize } = require('./functions');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

/**
 * Get the data of a specific clinic.
 * @param {string} id the id of the requested clinic.
 * @returns the data of the requested clinic.
 */
async function get(id) {
	return db.collection("clinics").doc(id).get().then(clinic_snap => {
		const clinic = clinic_snap.data();
		clinic.id = clinic_snap.id;

		return clinic;
	});
}

/**
 * Get all the doctors who work in the given clinic.
 * @param {string} clinic The id of the clinic.
 * @returns {Promise<{doctor: object, user: object, clinics: object[], fields: string[]}[]>} The data of the requested doctors.
 */
async function getAllDoctors(clinic) {
	return db.collection("clinics").doc(clinic).collection("doctors").get().then(doctor_snaps => {
		const promises = [];

		for (const doctor of doctor_snaps.docs) {
			promises.push(doctors.getData(doctor.id));
		}

		return Promise.all(promises);
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
	db.collection("clinics").add({
		name: name,
		city: city,
		address: address,
		owner: doctor
	}).then(clinicRef => {
		clinicRef.collection("doctors").doc(doctor).set({exists: true});
		db.collection("doctors").doc(doctor).collection("clinics").doc(clinicRef.id).set({exists: true});
		db.collection("cities").doc(city).set({exists: true});
		db.collection("cities").doc(city).collection("clinics").doc(clinicRef.id).set({exists: true});
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
async function edit(clinic, doctor, name, city, address) {
	return db.collection("clinics").doc(clinic).get().then(clinic_snap => {
		const response = {
			success: false,
			message: ""
		};

		if (clinic_snap.data().owner === doctor) {
			return db.collection("clinics").doc(clinic).update({
				name: name,
				city: city,
				address: address
			}).then(() => {
				response.success = true;
				return response;
			});
		}

		response.message = "It's not your clinic.";
		return response;
	});
}

/**
 * Delete a clinic.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The doctor who is requesting the change.
 * @returns {Promise<{success: boolean, message: string}>} whether the operation succeeded, and if not, why not.
 */
async function eliminate(clinic, doctor) {
	return db.collection("clinics").doc(clinic).get().then(clinic_snap => {
		const response = {
			success: false,
			message: ""
		};

		if (clinic_snap.data().owner === doctor) {
			// Go over all of the clnic's doctors and remove the clinic from their profile:
			return db.collection("clinics").doc(clinic).collection("doctors").get().then(doctor_snaps => {
				const doctor_promises = [];

				for (const doctor_snap of doctor_snaps.docs) {
					doctor_promises.push(
						db.collection("doctors").doc(doctor_snap.id).collection("clinics").doc(clinic).delete()
					);
				}

				// Delete the clinic:
				doctor_promises.push(db.collection("clinics").doc(clinic).delete());

				// Remove the clinic from the city:
				doctor_promises.push(
					db.collection("cities").doc(clinic_snap.data().city).collection("clinics").doc(clinic).delete()
				);

				return Promise.all(doctor_promises).then(() => {
					response.success = true;
					return response;
				});
			});
		}

		response.message = "It's not your clinic.";
		return response;
	});
}

/**
 * Have a doctor leave a clinic in which he works (does not change ownership of the clinic).
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 */
async function leave(clinic, doctor) {
	db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).delete();
	db.collection("doctors").doc(doctor).collection("clinics").doc(clinic).delete();
}

/**
 * Add a doctor to a clinic.
 * @param {string} clinic The id of the clinic.
 * @param {string} requester The doctor who is requesting the change.
 * @param {string} doctor The doctor one wishes to add.
 * @returns {Promise<{success: boolean, message: string}>} whether the operation succeeded, and if not, why not.
 */
async function join(clinic, requester, doctor) {
	return db.collection("clinics").doc(clinic).get().then(clinic_snap => {
		const response = {
			success: false,
			message: ""
		};

		if (clinic_snap.data().owner === requester) {
			db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).set({exists: true}).then(() => {
				return db.collection("doctors").doc(doctor).collection("clinics").doc(clinic).set({exists: true}).then(() => {
					response.success = true;
					return response;
				})
			})
		}

		response.message = "It's not your clinic.";
		return response;
	});
}

/**
 * Get the ids and display names of all the cities that have clinics.
 * @returns {Promise<{id: string, label: string}[]>} the ids and display names of all the cities.
 */
async function getAllCities() {
	return db.collection("cities").get().then(city_snaps => {
		let cities = [];
		
		for (const city_snap of city_snaps.docs) {
			cities.push({
				id: city_snap.id,
				label: capitalize(city_snap.id)
			});
		}
		
		return cities;
	});
}

exports.get = get;
exports.getAllDoctors = getAllDoctors;
exports.add = add;
exports.edit = edit;
exports.delete = eliminate;
exports.leave = leave;
exports.join = join;
exports.getAllCities = getAllCities;