// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const users = require("../implementations/users");

exports.getPicture = functions.https.onCall((data, context) => {
	return users.getPicture(data.id);
});

exports.updatePicture = functions.https.onCall((data, context) => {
	return users.updatePicture(data.id);
});