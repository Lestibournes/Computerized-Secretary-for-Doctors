// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const clinics = require('../implementations/clinics');

exports.updateCity = functions.firestore.document('clinics/{clinicID}').onWrite((change, context) => {
	return clinics.updateCity(change, context);
});