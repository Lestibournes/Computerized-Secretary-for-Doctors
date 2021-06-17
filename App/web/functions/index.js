// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

// const serviceAccount = require("../Service Account Key/csfpd-da7e7-firebase-adminsdk-pn31t-663c8a4bc9.json");

admin.initializeApp(
	// {
	// 	credential: admin.credential.cert(serviceAccount)
	// }
);

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const fsdb = admin.firestore();

// Public interface of server functions:

exports.clinics = require('./interfaces/clinics');
exports.doctors = require('./interfaces/doctors');
exports.appointments = require('./interfaces/appointments');
exports.specializations = require('./interfaces/specializations');
exports.schedules = require('./interfaces/schedules');
exports.secretaries = require('./interfaces/secretaries');
exports.links = require('./interfaces/links');

exports.events = require('./events');