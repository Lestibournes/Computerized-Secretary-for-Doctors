// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const clinics = require("../implementations/clinics");

exports.get = functions.https.onCall((data, context) => {
	return clinics.get(data.id);
});

exports.getAll = functions.https.onCall((data, context) => {
	return clinics.getAll(data.doctor);
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

exports.getAllDoctors = functions.https.onCall((data, context) => {
	return clinics.getAllDoctors(data.clinic);
});

exports.addDoctor = functions.https.onCall((data, context) => {
	return clinics.addDoctor(data.clinic, data.requester ,data.doctor);
});

exports.removeDoctor = functions.https.onCall((data, context) => {
	return clinics.removeDoctor(data.clinic, data.doctor);
});

exports.getAllSecretaries = functions.https.onCall((data, context) => {
	return clinics.getAllSecretaries(data.clinic);
});

exports.addSecretary = functions.https.onCall((data, context) => {
	return clinics.addSecretary(data.clinic, data.requester ,data.secretary);
});

exports.removeSecretary = functions.https.onCall((data, context) => {
	return clinics.removeSecretary(data.clinic, data.secretary, context);
});

exports.hasSecretary = functions.https.onCall((data, context) => {
	return clinics.hasSecretary(data.clinic, data.secretary);
});

exports.getAllCities = functions.https.onCall((data, context) => {
	return clinics.getAllCities();
});

exports.getAppointments = functions.https.onCall((data, context) => {
	return clinics.getAppointments(data.clinic, data.start, data.end, context);
});
