// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

const serviceAccount = require("../Service Account Key/csfpd-da7e7-firebase-adminsdk-pn31t-db712f9278.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

// Public interface of server functions:

exports.clinics = require('./interfaces/clinics');
exports.doctors = require('./interfaces/doctors');
exports.appointments = require('./interfaces/appointments');
exports.users = require('./interfaces/users');
exports.specializations = require('./interfaces/specializations');
exports.schedules = require('./interfaces/schedules');
exports.secretaries = require('./interfaces/secretaries');