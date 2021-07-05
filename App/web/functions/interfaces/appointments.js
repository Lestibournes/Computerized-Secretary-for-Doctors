// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const { SimpleDate } = require('../utilities/SimpleDate');

const appointments = require('../implementations/appointments');
const environment  = require('../index').environment;
const globals = require('../index').globals;

// exports.verifyAppointment = functions.firestore.document(globals.CLINICS + '/{clinicID}/' + globals.APPOINTMENTS + '/{appID}').onWrite((change, context) => {
// 	return appointments.verifyAppointment(change, context);
// });

exports.getAvailable = functions.https.onCall((data, context) => {
	return appointments.getAvailable(environment, globals, data);
});