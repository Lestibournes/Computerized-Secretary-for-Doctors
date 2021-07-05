// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const doctors = require('../implementations/doctors');

exports.search = functions.https.onCall((data, context) => {
	return doctors.search(data.name, data.field, data.city);
});
