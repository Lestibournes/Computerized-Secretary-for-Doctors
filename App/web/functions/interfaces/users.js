// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const users = require("../implementations/users");

exports.add = functions.https.onCall((data, context) => {
	return users.add(data.user, data.firstName, data.lastName, context);
});

exports.get = functions.https.onCall((data, context) => {
	return users.get(data.user);
});

exports.getPicture = functions.https.onCall((data, context) => {
	return users.getPicture(data.id);
});

exports.updatePicture = functions.https.onCall((data, context) => {
	return users.updatePicture(data.id);
});

exports.update = functions.https.onCall((data, context) => {
	return users.update(data.id, data.changes);
});

exports.isDoctor = functions.https.onCall((data, context) => {
	return users.isDoctor(data.id);
});

exports.isSecretary = functions.https.onCall((data, context) => {
	return users.isSecretary(data.id);
});