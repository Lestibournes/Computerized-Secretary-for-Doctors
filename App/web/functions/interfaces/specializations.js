// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

async function updateSpecialization(change, context) {
	// Get an object with the current document value.
	// If the document does not exist, it has been deleted.
	const newDocument = change.after.exists ? change.after.data() : null;

	// Update spcializations index:
	if (!newDocument) {
		// remove the doctor from the old specialization index:
		db.collection("specializations").doc(context.params.specID).collection("doctors").doc(context.params.userID).delete();
		db.collection("specializations").doc(context.params.specID).collection("practitioners").doc(context.params.userID).delete();
	}
	
	if (newDocument) {
		// Add the document to the new specialization index:
		db.collection("specializations").doc(context.params.specID).set({exists: true}).then(() => {
			db.collection("specializations").doc(context.params.specID).collection("practitioners").doc(context.params.userID).set({
				practitioner: context.params.userID
			});
		});
	}
}

exports.updateSpecialization = functions.firestore.document('users/{userID}/specializations/{specID}').onWrite((change, context) => {
	return updateSpecialization(change, context);
});