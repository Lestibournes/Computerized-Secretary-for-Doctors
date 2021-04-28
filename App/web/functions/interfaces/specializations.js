// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const specializations = require("../implementations/specializations");

exports.search = functions.https.onCall((data, context) => {
	return specializations.search(data.text);
});

exports.create = functions.https.onCall((data, context) => {
	return specializations.create(data.name);
});

exports.getAll = functions.https.onCall((data, context) => {
	return specializations.getAll();
});