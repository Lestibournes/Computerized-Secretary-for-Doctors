// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const schedules = require("../implementations/schedules");

exports.get = functions.https.onCall((data, context) => {
	return schedules.get(data.clinic, data.doctor);
});

exports.add = functions.https.onCall((data, context) => {
	return schedules.add(data.clinic, data.doctor, data.day, data.start, data.end, context);
});

exports.edit = functions.https.onCall((data, context) => {
	return schedules.edit(data.clinic, data.doctor, data.shift, data.day, data.start, data.end, context);
});

exports.delete = functions.https.onCall((data, context) => {
	return schedules.delete(data.clinic, data.doctor, data.shift, context);
});

exports.addType = functions.https.onCall((data, context) => {
	return schedules.addType(data.clinic, data.doctor, data.name, data.duration, context);
});

exports.editType = functions.https.onCall((data, context) => {
	return schedules.editType(data.clinic, data.doctor, data.type, data.name, data.duration, context);
});

exports.deleteType = functions.https.onCall((data, context) => {
	return schedules.deleteType(data.clinic, data.doctor, data.type, context);
});

exports.getTypes = functions.https.onCall((data, context) => {
	return schedules.getTypes(data.clinic, data.doctor);
});

exports.setMinimum = functions.https.onCall((data, context) => {
	return schedules.setMinimum(data.clinic, data.doctor, data.minimum, context);
});

exports.getMinimum = functions.https.onCall((data, context) => {
	return schedules.getMinimum(data.clinic, data.doctor);
});