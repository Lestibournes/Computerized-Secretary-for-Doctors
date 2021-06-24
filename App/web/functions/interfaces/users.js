// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

async function updateFullName(change, context) {
	// Get an object with the previous document value (for update or delete)
	// If the document does not exist, it has been created (?).
	const oldDocument = change.before.exists ? change.before.data() : null;

	// Get an object with the current document value.
	// If the document does not exist, it has been deleted.
	const newDocument = change.after.exists ? change.after.data() : null;

	// Update full name:
	if (!oldDocument || (newDocument && (oldDocument.firstName !== newDocument.firstName || oldDocument.lastName !== newDocument.lastName))) {
		// It's not a delete operation, meaning it's create or update:
		// Update the user's fullName property:
		db.collection("users").doc(context.params.userID).update({fullName: newDocument.firstName + " " + newDocument.lastName});
	}
}

exports.updateFullName = functions.firestore.document('users/{userID}').onWrite((change, context) => {
	return updateFullName(change, context);
});