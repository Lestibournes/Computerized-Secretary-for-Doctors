// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

admin.initializeApp();

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