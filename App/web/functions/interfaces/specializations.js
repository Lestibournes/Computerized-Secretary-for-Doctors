// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const specializations = require('../implementations/specializations');

exports.updateSpecialization = functions.firestore.document('users/{userID}/specializations/{specID}').onWrite((change, context) => {
	return specializations.updateSpecialization(change, context);
});