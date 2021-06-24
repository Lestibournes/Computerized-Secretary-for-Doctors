// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

async function updateLink(change, context) {
	// Get an object with the previous document value (for update or delete)
	// If the document does not exist, it has been created (?).
	const oldDocument = change.before.exists ? change.before.data() : null;

	// Get an object with the current document value.
	// If the document does not exist, it has been deleted.
	const newDocument = change.after.exists ? change.after.data() : null;

	// If a link was created for the first time, or is being updated (meaning replaced):
	if (newDocument) {
		const type = newDocument.type;
		const id = newDocument.id;
		const name = newDocument.name;
	
		if (type == "clinic") db.collection("clinics").doc(id).update({link: name});

		if (type == "doctor") db.collection("users").doc(id).update({link: name});

		db.collection("links").where("type", "==", type).where("id", "==", id).get().then(oldLinks => {
			for (const oldLink of oldLinks.docs) {
				if (oldLink.id !== context.params.linkID) oldLink.ref.delete();
			}
		});
	}
}

exports.modifyLink = functions.firestore.document('links/{linkID}').onWrite((change, context) => {
	return updateLink(change, context);
});