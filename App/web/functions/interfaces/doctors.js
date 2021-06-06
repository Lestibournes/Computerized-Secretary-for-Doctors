// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const doctors = require("../implementations/doctors");
 
exports.getData = functions.https.onCall((data, context) => {
	return doctors.getData(data.id, data.field, data.city);
});

exports.getAllClinics = functions.https.onCall((data, context) => {
	return doctors.getAllClinics(data.doctor);
});

exports.create = functions.https.onCall((data, context) => {
	return doctors.create(data.user);
});

exports.search = functions.https.onCall((data, context) => {
	return doctors.search(data.name, data.field, data.city);
});

exports.getID = functions.https.onCall((data, context) => {
	return doctors.getID(data.user);
});

exports.addSpecialization = functions.https.onCall((data, context) => {
	return doctors.addSpecialization(data.doctor, data.specialization);
});

exports.removeSpecialization = functions.https.onCall((data, context) => {
	return doctors.removeSpecialization(data.doctor, data.specialization);
});

exports.getAppointments = functions.https.onCall((data, context) => {
	return doctors.getAppointments(data.doctor, data.clinic, data.start, data.end, context);
});