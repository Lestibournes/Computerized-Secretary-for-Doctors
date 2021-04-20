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

exports.getAllSpecializations = functions.https.onCall((data, context) => {
	return doctors.getAllSpecializations();
});