// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const appointments = require("../implementations/appointments");
const { SimpleDate } = require('../implementations/SimpleDate');

exports.getAvailable = functions.https.onCall((data, context) => {
	return appointments.getAvailable(data.clinic, data.doctor, SimpleDate.fromObject(data.date), data.type);
});
