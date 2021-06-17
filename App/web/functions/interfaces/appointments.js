// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const appointments = require("../implementations/appointments");

exports.getAvailable = functions.https.onCall((data, context) => {
	return appointments.getAvailable(data.clinic, data.doctor, new Date(data.date), data.type);
});
