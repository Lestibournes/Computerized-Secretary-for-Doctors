// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

const specializations = require('./specializations');

const appointments = require('./appointments');

const stringContains = require('./functions').stringContains;

const SimpleDate = require('./SimpleDate').SimpleDate;

/**
 * Get the requested doctor and then filter his data by field of specialization and the city where the clinic is.
 * Except for id, all params are optional. If no parameters are specified (or if the value is falsy), then it will return all the data.
 * @todo Be more picky about which data is being returned.
 * @param {string} doctor The id of the doctor.
 * @param {string} field The doctor's specialization.
 * @param {string} city The city in which service is being sought.
 * @returns {Promise<{doctor: object, user: object, clinics: object[] ,fields: object[]}>} The data of the requested doctor.
 */
async function getData(doctor, field, city) {
	return db.collection("doctors").doc(doctor).get().then(doctor_snapshot => {
		const result = {
			doctor: null, // The doctor data.
			user: null, // The user data.
			clinics: [], // An array of the data of all the matching clinics associated with this doctor.
			fields: [], // An array of the ids of all the matching specializations of this doctor.
		};
		
		result.doctor = doctor_snapshot.data();
		result.doctor.id = doctor_snapshot.id;
		
		const promises = [];

		// Get the user data from refs:
		promises.push(
			db.collection("users").doc(result.doctor.user).get().then(user_snapshot => {
				result.user = user_snapshot.data();
				result.user.id = user_snapshot.id;
				result.user.fullName = user_snapshot.data().firstName + " " + user_snapshot.data().lastName;
			})
		);
		
		// Get the field data for the given doctor:
		promises.push(
			db.collection("doctors").doc(doctor).collection(specializations.NAME).get().then(spec_snaps => {
				for (let spec of spec_snaps.docs) {
					// Check if the field is unspecified or is a match:
					if ((field && stringContains(spec.id, field)) || !field) {
						let field_data = spec.data();
						field_data.id = spec.id;
						result.fields.push(field_data);
					}
				}
			})
		);

		// Get the clinic data for the given doctor:
		promises.push(
			getAllClinics(doctor, city).then(clinics => {
				result.clinics = clinics;
			})
		);
	
		return Promise.all(promises).then(() => {
			return result;
		});
	});
}

/**
 * Get the data of all the clinics of the specified doctor.
 * @param {string} doctor the id of the doctor
 * @param {string} city an optional city filter.
 * @returns {Promise<object[]>} an array of the data of all the clinics that the doctor works in.
 */
async function getAllClinics(doctor, city) {
	// Get the clinic data for the given doctor:
	return db.collection("doctors").doc(doctor).collection("clinics").get().then(clinic_snaps => {
		const clinic_promises = [];

		for (const clinic_snap of clinic_snaps.docs) {
			clinic_promises.push(
				db.collection("clinics").doc(clinic_snap.id).get().then(clinic_snapshot => {
					// Check if the city is unspecified or is a match:
					if ((city && stringContains(clinic_snapshot.data().city, city)) || !city) {
						let clinic_data = clinic_snapshot.data();
						clinic_data.id = clinic_snapshot.id;
						return clinic_data;
					}
				})
			);
		};

		return Promise.all(clinic_promises).then(clinics => {
			return clinics;
		});
	});
}

/**
 * Create a new doctor profile for the given user, on the condition that he doesn't already have one.
 * @param {string} user The id of the user.
 * @returns {Promise<{doctor: string, success: boolean}>} The id of the user's current doctor profile and whether a new doctor profile was created.
 */
async function create(user) {
	let result = {
		doctor: null,
		success: false
	};

	return db.collection("users").doc(user).get().then(user_snap => {
		if (!user_snap.data().doctor) {
			// If the user doesn't have a doctor profile then create a profile:
			return db.collection("doctors").add({
				user: user,
				approved: false
			}).then(doctor_ref => {
				// Add the doctor profile to the user:
				return db.collection("users").doc(user).update({
					doctor: doctor_ref.id
				}).then(() => {
					result.doctor = doctor_ref.id
					result.success = true;

					return result;
				});
			});
		}
	
		// If the user does have a doctor profile, then return the existing profile:
		result.doctor = user_snap.data().doctor;
	
		return result;
	});
}

/**
 * Get all doctors and then filter the results by name, field of specialization, and the city where their clinic is.
 * All params are optional. If no parameters are specified (or if the value is falsy), then it will return all doctors.
 * @todo Change the format of the data that is being returned and be more picky about which data is being returned.
 * @param {string} name The name of the doctor.
 * @param {string} field The doctor's specialization.
 * @param {string} city The city in which service is being sought.
 * @returns {Promise<{doctor: object, user: object, clinics: object[], fields: string[]}[]>} An array of the data of matching doctors.
 */
async function search(name, field, city) {
	// Fetch the data of all the doctor documents:
	const promises = [];
	
	return db.collection("doctors").get().then(doctor_snapshots => {
		doctor_snapshots.forEach(snapshot => {
			promises.push(getData(snapshot.id, field, city));
		});

		return Promise.all(promises).then(results => {
			const doctors = [];

			// Filter the doctors base on whether they have matching locations, specializations, and names:
			for (const result of results) {
				if (result.clinics.length > 0 && result.fields.length > 0 &&
					((name && stringContains(result.user.fullName, name)) || !name)) {
					doctors.push(result);
				}
			}

			return doctors;
		});
	});
}

/**
 * Get the id of the given user's doctor profile.
 * @param {string} user The id of the user
 * @returns {Promise<string>} the id of the doctor profile for the given user.
 * Null if he doesn't have one.
 */
async function getID(user) {
	return db.collection("users").doc(user).get().then(user_snap => {
		if (user_snap.data().doctor) return user_snap.data().doctor;

		return null;
	});
}

/**
 * Add a specialization to a doctor.
 * @param {string} doctor the id of the doctor
 * @param {string} specialization the name of the specialization, which also serves as its id.
 */
async function addSpecialization(doctor, specialization) {
	return db.collection(specializations.NAME).doc(specialization).collection("doctors").doc(doctor).set({exists: true})
	.then(() => {
		return db.collection("doctors").doc(doctor).collection(specializations.NAME).doc(specialization).set({exists: true});
	});
}

/**
 * Remove a specialization from a doctor.
 * @param {string} doctor the id of the doctor
 * @param {string} specialization the name of the specialization, which also serves as its id.
 */
async function removeSpecialization(doctor, specialization) {
	return db.collection(specializations.NAME).doc(specialization).collection("doctors").doc(doctor).delete()
	.then(() => {
		return db.collection("doctors").doc(doctor).collection(specializations.NAME).doc(specialization).delete();
	});
}


/**
 * Get all of the appointments of the specified doctor within the specified time range.
 * Start and end times are optional. If they are not specified then there will not be a limit on start and end times.
 * @param {{doctor: string, clinic: string, start: object, end: object}} constraints
 * @returns {Promise<object[]>} An array of appointment data.
 */
 async function getAppointments(doctor, clinic, start, end) {
	let promises = [];

	let query = db.collection("doctors").doc(doctor).collection("appointments");

	// if (clinic) {
	// 	query = query.collection("clinics").doc(clinic);
	// }

	console.log(start, SimpleDate.fromObject(start).day, SimpleDate.fromObject(start).toDate())
	if (start || end ) query = query.orderBy("start");
	if (start) query = query.startAt(SimpleDate.fromObject(start).toDate());
	if (end) query = query.endAt(SimpleDate.fromObject(end).toDate());

	return query.get().then(querySnapshot => {
		for (const snap of querySnapshot.docs) {
			promises.push(
				appointments.get(snap.id).then(appointment => {
					return appointment;
				})
			);
		}

		return Promise.all(promises).then(results => {
			return results;
		});
	});
}

exports.getData = getData;
exports.getAllClinics = getAllClinics;
exports.create = create;
exports.search = search;
exports.getID = getID;
exports.addSpecialization = addSpecialization;
exports.removeSpecialization = removeSpecialization;
exports.getAppointments = getAppointments;