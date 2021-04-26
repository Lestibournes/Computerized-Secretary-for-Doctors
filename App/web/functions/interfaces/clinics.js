// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const clinics = require("../implementations/clinics");

exports.get = functions.https.onCall((data, context) => {
	return clinics.get(data.id);
});

exports.getAll = functions.https.onCall((data, context) => {
	return clinics.getAll(data.doctor);
});

exports.getAllDoctors = functions.https.onCall((data, context) => {
	return clinics.getAllDoctors(data.clinic);
});

exports.add = functions.https.onCall((data, context) => {
	return clinics.add(data.doctor, data.name, data.city, data.address);
});

exports.edit = functions.https.onCall((data, context) => {
	return clinics.edit(data.id, data.doctor, data.name, data.city, data.address);
});

exports.delete = functions.https.onCall((data, context) => {
	return clinics.delete(data.id, data.doctor);
});

exports.leave = functions.https.onCall((data, context) => {
	return clinics.leave(data.clinic, data.doctor);
});

exports.join = functions.https.onCall((data, context) => {
	return clinics.join(data.clinic, data.requester ,data.doctor);
});

exports.getAllCities = functions.https.onCall((data, context) => {
	return clinics.getAllCities();
});
