// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const firebase = require("@google-cloud/firestore");

const { SimpleDate } = require('../utilities/SimpleDate');

const appointments = require('../implementations/appointments');
const environment  = require('../globals').environment;
const globals = require('../globals').strings;

exports.getAvailable = functions.https.onCall((data, context) => {
	return appointments.getAvailable(environment, globals, data);
});

exports.addAppointment = functions.https.onCall((data, context) => {
	data.patient = context.auth.uid;
	data.time = firebase.Timestamp.fromMillis(data.time);
	return appointments.addAppointment(environment, globals, data);
});

exports.updateAppointment = functions.https.onCall((data, context) => {
	data.patient = context.auth.uid;
	data.time = firebase.Timestamp.fromMillis(data.time);
	return appointments.addAppointment(environment, globals, data);
});