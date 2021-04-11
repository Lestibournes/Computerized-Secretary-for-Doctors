// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const appointments = require("../implementations/appointments");

exports.getAvailable = functions.https.onCall((data, context) => {
	return appointments.getAvailable(data.doctor, data.clinic, data.date, data.type);
});

exports.add = functions.https.onCall((data, context) => {
	return appointments.add(data.doctor, data.clinic, data.patient, data.date, data.time, data.type);
});

exports.edit = functions.https.onCall((data, context) => {
	return appointments.edit(data.appointment, data.date, data.time, data.type);
});

exports.cancel = functions.https.onCall((data, context) => {
	return appointments.cancel(data.appointment);
});