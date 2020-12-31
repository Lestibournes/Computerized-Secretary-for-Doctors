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
		let promises = [];
		let matches = [];

		doctors.forEach(doctor => {
			promises.push(doctor.data().user.get());
		});

		return Promise.all(promises).then((users) => {
			users.forEach((user) => {
				let name = user.data().firstName + " " + user.data().lastName;
				if (contains(name, data.name)) {
					matches.push(name);
				}
			});

			return matches;
		});
	});
});

