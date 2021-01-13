// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const stringContains = (text, search) => {
	let src = (String) (text);
	let term = (String) (search);

	for (let i = 0; i < src.length; i++) {
		if (src.substr(i, term.length).toLowerCase() === term.toLowerCase()) {
			return true;
		}
	}

	return false;
}

async function getDoctors(name, field, city) {
	const doctors = [];

	await db.collection("doctors").get().then(snapshots => {
		snapshots.forEach(snapshot => {
			doctors.push({
				id: null, //user id
				user: null, //user data
				doctor: snapshot.data(), //doctor data
				clinics: [], //list of clinics in the specified city
				fields: [], //list of doctor specializations that match the requested specialization
			});
		});
	});
	
	for (const doctor of doctors) {
		await doctor.doctor.user.get().then(user_snapshot => {
			doctor.id = user_snapshot.id;
			doctor.user = user_snapshot.data();
		});

		let fullName = doctor.user.firstName + " " + doctor.user.lastName;

		if ((name && stringContains(fullName, name)) || !name) {
			for (i in doctor.doctor.clinics) {
				await doctor.doctor.fields[i].get().then(field_snapshot => {
					if ((field && stringContains(field_snapshot.id, field)) || !field) {
						doctor.fields.push(field_snapshot.id);
					}
				});
				await doctor.doctor.clinics[i].get().then(clinic_snapshot => {
					if ((city && stringContains(clinic_snapshot.data().city, city)) || !city) {
						let temp = clinic_snapshot.data();
						temp.id = clinic_snapshot.id;
						doctor.clinics.push(temp);
					}
				});
			};
		}
	}

	const results = [];
	for (const doctor of doctors) {
		if (doctor.clinics.length > 0 && doctor.fields.length > 0) {
			results.push(doctor);
		}
	}

	return results;
}

exports.searchDoctors = functions.https.onCall((data, context) => {
	return getDoctors(data.name, data.field, data.city);
});

