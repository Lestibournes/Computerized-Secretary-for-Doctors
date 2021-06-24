// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

async function updateCity(change, context) {
	// Get an object with the previous document value (for update or delete)
	// If the document does not exist, it has been created (?).
	const oldDocument = change.before.exists ? change.before.data() : null;

	// Get an object with the current document value.
	// If the document does not exist, it has been deleted.
	const newDocument = change.after.exists ? change.after.data() : null;

	// Update city index:
	if (!oldDocument || (newDocument && oldDocument.city !== newDocument.city)) {
		if (oldDocument) {
			// remove the clinic from the old city index:
			db.collection("cities").doc(oldDocument.city).collection("clinics").doc(context.params.clinicID).delete();
	
			// If the old city index is now empty, delete it:
			// Or maybe not. Just don't show cities that have no clinics.
		}
	
		if (newDocument) {
			// Add the document to the new city index:
			db.collection("cities").doc(newDocument.city).set({exists: true}).then(() => {
				db.collection("cities").doc(newDocument.city).collection("clinics").doc(context.params.clinicID).set({exists: true});
			})
		}
	}
}

exports.updateCity = functions.firestore.document('clinics/{clinicID}').onWrite((change, context) => {
	return updateCity(change, context);
});