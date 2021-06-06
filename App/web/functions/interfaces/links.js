// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

const links = require("../implementations/links");
 
exports.isAvailable = functions.https.onCall((data, context) => {
	return links.isAvailable(data.name);
});

exports.register = functions.https.onCall((data, context) => {
	return links.register(data.name, data.type, data.id, context);
});

exports.get = functions.https.onCall((data, context) => {
	return links.get(data.type, data.id);
});