const admin = require('firebase-admin');
const functions = require('firebase-functions');
const fsdb = admin.firestore();

exports.modifyClinic = functions.firestore.document('clinics/{clinicID}').onWrite((change, context) => {
	// Get an object with the previous document value (for update or delete)
	// If the document does not exist, it has been created (?).
	const oldDocument = change.before.exists ? change.before.data() : null;

	// Get an object with the current document value.
	// If the document does not exist, it has been deleted.
	const newDocument = change.after.exists ? change.after.data() : null;

	// Update city index:
	if (oldDocument.city !== newDocument.city) {
		if (oldDocument) {
			// remove the clinic from the old city index:
			fsdb.collection("cities").doc(oldDocument.city).collection("clinics").doc(context.params.clinicID).delete();
	
			// If the old city index is now empty, delete it:
			// Or maybe not. Just don't show cities that have no clinics.
		}
	
		if (newDocument) {
			// Add the document to the new city index:
			fsdb.collection("cities").doc(newDocument.city).set({exists: true}).then(() => {
				fsdb.collection("cities").doc(newDocument.city).collection("clinics").doc(context.params.clinicID).set({exists: true});
			})
		}
	}
});

exports.modifySpecializations = functions.firestore.document('users/{userID}/specializations/{specID}').onWrite((change, context) => {
	// Get an object with the current document value.
	// If the document does not exist, it has been deleted.
	const newDocument = change.after.exists ? change.after.data() : null;

	// Update spcializations index:
	if (!newDocument) {
		// remove the doctor from the old specialization index:
		fsdb.collection("specializations").doc(context.params.specID).collection("doctors").doc(context.params.userID).delete();
	}
	
	if (newDocument) {
		// Add the document to the new specialization index:
		fsdb.collection("specializations").doc(context.params.specID).set({exists: true}).then(() => {
			fsdb.collection("specializations").doc(context.params.specID).collection("doctors").doc(context.params.userID).set({exists: true});
		});
	}
});

exports.modifyUser = functions.firestore.document('users/{userID}').onWrite((change, context) => {
	// Get an object with the previous document value (for update or delete)
	// If the document does not exist, it has been created (?).
	const oldDocument = change.before.exists ? change.before.data() : null;

	// Get an object with the current document value.
	// If the document does not exist, it has been deleted.
	const newDocument = change.after.exists ? change.after.data() : null;

	// Update city index:
	if (oldDocument.firstName !== newDocument.firstName || oldDocument.lastName !== newDocument.lastName) {
		// It's not a delete operation, meaning it's create or update:
		if (newDocument) {
			// Update the user's fullName property:
			fsdb.collection("users").doc(context.params.userID).update({fullName: newDocument.firstName + " " + newDocument.lastName});
		}
	}
});

// Add another listener for when an appointment is deleted. Whene that happens, delete the arrival document.
// Or is that even needed? Past appointments can't be deleted. An arrival document without an appointment document is meaningless.

// Missing triggers:
// Patient's index of treating doctors.