// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const secretaries = require('../implementations/secretaries');

exports.search = functions.https.onCall((data, context) => {
	return secretaries.search(data.name);
});