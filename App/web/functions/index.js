// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const st = admin.storage().bucket("csfpd-da7e7.appspot.com");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

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

const stringArrayContains = (arr, str) => {
	for (let i = 0; i < arr.length; i++) {
		if (stringContains(arr[i], str)) {
			return true;
		}
	}

	return false;
}

async function getDoctors(name, field, city) {
	const doctors = [];
	await db.collection("doctors").get().then(snapshots => {
		snapshots.forEach(snapshot => {
			// Create an object to hold the doctor data, the doctor's user data, and the promise (although the promise may be unnecessary).
			doctors.push({
				id: null,
				doctor: snapshot.data(),
				clinics: [],
				user: null,
				profile: null
			});
		});
	});
	
	for (const doctor of doctors) {
		if ((field && stringArrayContains(doctor.doctor.fields, field)) || !field) {
			await doctor.doctor.user.get().then(user => {
				doctor.id = user.id;
				doctor.user = user.data();
			});

			let fullName = doctor.user.firstName + " " + doctor.user.lastName;

			if ((fullName && stringContains(fullName, name)) || !fullName) {
				doctor.profile = st.file("users/" + doctor.id + "/profile.png").publicUrl();
				
				for (i in doctor.doctor.clinics) {
					await doctor.doctor.clinics[i].get().then(clinic => {
						if ((city && stringContains(clinic.data().city, city)) || !city) {
							doctor.clinics.push(clinic.data());
						}
					});
				};
			}
		}
	}

	return doctors;
}

exports.searchDoctors = functions.https.onCall((data, context) => {
	return getDoctors(data.name, data.field, data.city);
});

