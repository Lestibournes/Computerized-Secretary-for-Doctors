// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

// const serviceAccount = require("../Service Account Key/csfpd-da7e7-firebase-adminsdk-pn31t-663c8a4bc9.json");

admin.initializeApp(
	// {
	// 	credential: admin.credential.cert(serviceAccount)
	// }
);


const environment = {
	admin: require('firebase-admin')
}

const globals = {
	USERS: "users",
	CLINICS: "clinics",
	DOCTORS: "doctors",
	APPOINTMENTS: "appointments",
	TYPES: "types",
	SHIFTS: "shifts"
}

// Public interface of server functions:

exports.appointments = require('./interfaces/appointments');

exports.clinics = require('./interfaces/clinics');
exports.doctors = require('./interfaces/doctors');
exports.secretaries = require('./interfaces/secretaries');
exports.specializations = require('./interfaces/specializations');

exports.environment = environment;
exports.globals = globals;

// Add another listener for when an appointment is deleted. Whene that happens, delete the arrival document.
// Or is that even needed? Past appointments can't be deleted. An arrival document without an appointment document is meaningless.

// Missing triggers:
// Patient's index of treating doctors.