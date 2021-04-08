const fs = require("@google-cloud/firestore");

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

// Public interface of server functions:

exports.clinics = require('./clinics');
exports.doctors = require('./doctors');
exports.appointments = require('./appointments');