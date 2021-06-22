// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const appointments = require("../implementations/appointments");
const { SimpleDate } = require('../implementations/SimpleDate');

exports.getAvailable = functions.https.onCall((data, context) => {
	const date = SimpleDate.fromObject(data.date).toDate();
	return appointments.getAvailable(data.clinic, data.doctor, date, data.type);
});
