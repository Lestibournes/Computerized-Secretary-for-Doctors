const admin = require('firebase-admin');
const functions = require('firebase-functions');
const fsdb = admin.firestore();

exports.modifyClinic = functions.firestore
		.document('clinics/{clinicID}')
		.onWrite((change, context) => {
			// Get an object with the previous document value (for update or delete)
			// If the document does not exist, it has been created (?).
			const oldDocument = change.before.exists ? change.before.data() : null;

			// Get an object with the current document value.
			// If the document does not exist, it has been deleted.
			const newDocument = change.after.exists ? change.after.data() : null;

			console.log(oldDocument, newDocument);

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
		});