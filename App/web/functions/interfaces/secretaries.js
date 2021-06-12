// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const secretaries = require("../implementations/secretaries");
 
exports.getData = functions.https.onCall((data, context) => {
	return secretaries.getData(data.secretary);
});

exports.getAllClinics = functions.https.onCall((data, context) => {
	return secretaries.getAllClinics(data.secretary);
});

exports.create = functions.https.onCall((data, context) => {
	return secretaries.create(data.user);
});

exports.search = functions.https.onCall((data, context) => {
	return secretaries.search(data.name);
});