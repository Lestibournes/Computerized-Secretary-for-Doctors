// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

const { stringContains } = require('../utilities/functions');

async function getSpecializations(user_id, specialization) {
	let query = db.collection("users").doc(user_id).collection("specializations");

	if (specialization) query = query.where("specialization", "==", specialization);

	return query.get().then(spec_snaps => {
		const specializations = [];

		for (const spec_snap of spec_snaps.docs) {
			if (spec_snap.exists && (!specialization || stringContains(spec_snap.id, specialization))) {
				const spec_data = spec_snap.data();
				spec_data.id = spec_snap.id;
				specializations.push(spec_data);
			}
		}

		return specializations;
	});
}

async function getClinics(user_id, city) {
	const clinic_promises = [];

	return db.collectionGroup("doctors").where("user", "==", user_id).get()
	.then(doctor_snaps => {
		for (const doctor_snap of doctor_snaps.docs) {
			const clinicRef = doctor_snap.ref.parent.parent;
			
			clinic_promises.push(
				clinicRef.get().then(clinic_snap => {
					if (clinic_snap.exists && (!city || stringContains(clinic_snap.data().city, city))) {
						const clinic_data = clinic_snap.data();
						clinic_data.id = clinic_snap.id;
						return clinic_data;
					}
					
					return null;
				})
			);
		}

		return Promise.all(clinic_promises).then(clinic_data => {
			const clinics = [];

			for (const clinic of clinic_data) {
				if (clinic) clinics.push(clinic);
			}

			return clinics;
		});
	});
}

async function getUser(user, specialization, city) {
	const promises = [];

	// Get the clinics:
	promises.push(
		getClinics(user.id, city).then(clinics => user.clinics = clinics)
	)
		// Get the specializations:
	promises.push(
		getSpecializations(user.id, specialization).then(specializations => user.specializations = specializations)
	)

	return Promise.all(promises).then(() => {
		return user;
	});
}

/**
 * Get all doctors and then filter the results by name, field of specialization, and the city where their clinic is.
 * All params are optional. If no parameters are specified (or if the value is falsy), then it will return all doctors.
 * @todo Change the format of the data that is being returned and be more picky about which data is being returned.
 * @param {string} name The name of the doctor.
 * @param {string} specialization The doctor's specialization.
 * @param {string} city The city in which service is being sought.
 * @returns {Promise<{doctor: object, user: object, clinics: object[], fields: string[]}[]>} An array of the data of matching doctors.
 */
 async function search(name, specialization, city) {
	// Get all the user documents:
	return db.collection("users").get().then(user_snaps => {
		const promises = [];
		
		for (const user_snap of user_snaps.docs) {
			// Filter by whether the user is a doctor and whether the name is a match:
			if (user_snap.exists && user_snap.data().doctor && (!name || user_snap.data().fullName.toLowerCase().includes(name.toLowerCase()))) {
				const user_data = user_snap.data();
				user_data.id = user_snap.id;
				promises.push(getUser(user_data, specialization, city));
			}
		}

		return Promise.all(promises).then(user_data => {
			const doctors = [];

			for (const user of user_data) {
				if (user.clinics.length > 0 && user.specializations.length > 0) doctors.push(user);
			}

			return doctors;
		})
	});
}

exports.search = search;