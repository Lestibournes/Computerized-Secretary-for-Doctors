// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const appointments = require("../implementations/appointments");

exports.getAvailable = functions.https.onCall((data, context) => {
	return appointments.getAvailable(data.doctor, data.clinic, data.date, data.type);
});
