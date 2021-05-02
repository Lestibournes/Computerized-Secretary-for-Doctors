// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const schedules = require("../implementations/schedules");

exports.get = functions.https.onCall((data, context) => {
	return schedules.get(data.clinic, data.doctor);
});

exports.add = functions.https.onCall((data, context) => {
	return schedules.add(data.clinic, data.doctor, data.day, data.start, data.end, data.min);
});

exports.delete = functions.https.onCall((data, context) => {
	return schedules.delete(data.clinic, data.doctor, data.shift);
});