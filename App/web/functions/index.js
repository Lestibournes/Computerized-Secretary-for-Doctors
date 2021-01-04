// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

admin.initializeApp();
db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const contains = (str1, str2) => {
	let src = (String) (str1);
	let term = (String) (str2);

	for (let i = 0; i < src.length; i++) {
		if (src.substr(i, term.length).toLowerCase() === term.toLowerCase()) {
			return true;
		}
	}

	return false;
}

exports.searchDoctors = functions.https.onCall((data, context) => {
	return db.collection("doctors").get().then((doctors) => {
		let promises = []; //holds the promises so that it will be possible to wait for them all to finish.
		let results = []; //holds the doctors who match the search term.

		doctors.forEach(doctor => {
			// Create an object to hold the doctor data, the doctor's user data, and the promise (although the promise may be unnecessary).
			let details = {
				id: null,
				doctor: doctor.data(),
				clinics: [],
				user: null,
				profile: null
			}

			// Get the promise to update the search result object with the user data and add it to the promises array
			// To wait for completion.
			promises.push(doctor.data().user.get().then((user) => {
				details.user = user.data();
				details.id = user.id;

				let name = user.data().firstName + " " + user.data().lastName;
				if (contains(name, data.name)) {
					results.push(details);
				}
			}));

			// For every one of the doctor's clinics,
			// Get the promise to update the search result object with the user data and add it to the promises array
			// To wait for completion.
			doctor.data().clinics.forEach((clinicRef) => {
				promises.push(clinicRef.get().then((clinic) => {
					details.clinics.push(clinic.data());
				}));
			});
		});

		return Promise.all(promises).then(() => {
			console.log(results);
			return results;
		});
	});
});

