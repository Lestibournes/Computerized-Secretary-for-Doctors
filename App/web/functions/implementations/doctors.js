// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

const stringContains = require('./functions').stringContains;

/**
 * Get the requested doctor and then filter his data by field of specialization and the city where the clinic is.
 * Except for id, all params are optional. If no parameters are specified (or if the value is falsy), then it will return all the data.
 * @todo Be more picky about which data is being returned.
 * @param {string} id The id of the doctor.
 * @param {string} field The doctor's specialization.
 * @param {string} city The city in which service is being sought.
 * @returns {{doctor: object, user: object, clinics: object[], fields: string[]}} The data of the requested doctor.
 */
 async function get(id, field, city) {
	 const result = {
		 doctor: null, // The doctor data.
		 user: null, // The user data.
		 clinics: [], // An array of the data of all the matching clinics associated with this doctor.
		 fields: [], // An array of the ids of all the matching specializations of this doctor.
		};
		
		await db.collection("doctors").doc(id).get().then(doctor_snapshot => {
			result.doctor = doctor_snapshot.data();
			result.doctor.id = doctor_snapshot.id;
		});
		
		// Get the user data from refs:
		await db.collection("users").doc(result.doctor.user).get().then(user_snapshot => {
			result.user = user_snapshot.data();
			result.user.id = user_snapshot.id;
		});
		
		// Get the field data for the given doctor:
		for (let f of result.doctor.fields) {
			if (f) {
				await db.collection("fields").doc(f).get().then(field_snapshot => {
					// Check if the field is unspecified or is a match:
					if ((field && stringContains(field_snapshot.id, field)) || !field) {
						let field_data = field_snapshot.data();
						field_data.id = field_snapshot.id;
						result.fields.push(field_data);
					}
				});
			}
		}
		
		// Get the clinic data for the given doctor:
		for (i in result.doctor.clinics) {
			await db.collection("clinics").doc(result.doctor.clinics[i]).get().then(clinic_snapshot => {
				// Check if the city is unspecified or is a match:
				if ((city && stringContains(clinic_snapshot.data().city, city)) || !city) {
					let clinic_data = clinic_snapshot.data();
					clinic_data.id = clinic_snapshot.id;
					result.clinics.push(clinic_data);
				}
			});
		};
	
	return result;
}


/**
 * Get the data of all the clinics of the specified doctor.
 * @param {string} doctor the id of the doctor
 * @returns {object[]} an array of the data of all the clinics that the doctor works in.
 */
 async function getAllClinics(doctor) {
	const clinic_data = [];

	let clinic_ids = [];
	await db.collection("doctors").doc(doctor).get().then(doctor_snap => {
		if (doctor_snap.data().clinics) {
			clinic_ids = doctor_snap.data().clinics;
		}
	});

	for (let clinic_id of clinic_ids) {
		await db.collection("clinics").doc(clinic_id).get().then(clinic_snap => {
			const clinic = clinic_snap.data();
			clinic.id = clinic_snap.id;

			clinic_data.push(clinic);
		});
	}
	
	return clinic_data;
}

/**
 * Create a new doctor profile for the given user, on the condition that he doesn't already have one.
 * @param {string} id The id of the user.
 * @returns {{doctor: string, success: boolean}} The id of the user's current doctor profile and whether a new doctor profile was created.
 */
async function create(id) {
	let result = {
		doctor: null,
		success: false
	};

	let doctor_id = null;
	
	await db.collection("users").doc(id).get().then(user_snap => {
		doctor_id = user_snap.data().doctor;
	});

	if (!doctor_id) {
		await db.collection("doctors").add({
			user: id,
			approved: false,
			fields: [],
			clinics: []
		}).then(doctor_ref => {
			doctor_id = doctor_ref.id;
		});

		await db.collection("users").doc(id).update({
			doctor: doctor_id
		}).then(user_snap => {
			result.success = true;
		});
	}

	result.doctor = doctor_id;

	return result;
}

/**
 * Get all doctors and then filter the results by name, field of specialization, and the city where their clinic is.
 * All params are optional. If no parameters are specified (or if the value is falsy), then it will return all doctors.
 * @todo Change the format of the data that is being returned and be more picky about which data is being returned.
 * @param {string} name The name of the doctor.
 * @param {string} field The doctor's specialization.
 * @param {string} city The city in which service is being sought.
 * @returns {{doctor: object, user: object, clinics: object[], fields: string[]}[]} An array of the data of matching doctors.
 */
async function search(name, field, city) {
	// Fetch the data of all the doctor documents:
	const doctors = [];

	await db.collection("doctors").get().then(snapshots => {
		snapshots.forEach(snapshot => {
			let doctor = snapshot.data();
			doctor.id = snapshot.id;

			doctors.push({
				doctor: doctor, // The doctor data.
				user: null, // The user data.
				clinics: [], // An array of the data of all the matching clinics associated with this doctor.
				fields: [], // An array of the ids of all the matching specializations of this doctor.
			});
		});
	});
	
	for (const doctor of doctors) {
		// Get the user data from refs:
		await db.collection("users").doc(doctor.doctor.user).get().then(user_snapshot => {
			doctor.user = user_snapshot.data();
			doctor.user.id = user_snapshot.id;
		});

		// Check if the name is unspecified or is a match:
		let fullName = doctor.user.firstName + " " + doctor.user.lastName;

		// Only consider doctors who's name is a match or not specified:
		if ((name && stringContains(fullName, name)) || !name) {
			// Get the field data for the given doctor:
			for (let f of doctor.doctor.fields) {
				if (f) {
					await db.collection("fields").doc(f).get().then(field_snapshot => {
						// Check if the field is unspecified or is a match:
						if ((field && stringContains(field_snapshot.id, field)) || !field) {
							let field_data = field_snapshot.data();
							field_data.id = field_snapshot.id;
							doctor.fields.push(field_data);
						}
					});
				}
			}

			// Get the clinic data for the given doctor:
			for (let c of doctor.doctor.clinics) {
				await db.collection("clinics").doc(c).get().then(clinic_snapshot => {
					// Check if the city is unspecified or is a match:
					if ((city && stringContains(clinic_snapshot.data().city, city)) || !city) {
						let clinic_data = clinic_snapshot.data();
						clinic_data.id = clinic_snapshot.id;
						doctor.clinics.push(clinic_data);
					}
				});
			};
		}
	}

	// Only add to the results the doctors who have both fields and clinics that are a match:
	const results = [];
	for (const doctor of doctors) {
		if (doctor.clinics.length > 0 && doctor.fields.length > 0) {
			results.push(doctor);
		}
	}

	return results;
}

exports.get = get;
exports.getAllClinics = getAllClinics;
exports.create = create;
exports.search = search;