// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

const { stringContains } = require('../utilities/functions');

/**
 * Get all secretaries and then filter the results by name.
 * All params are optional. If no parameters are specified (or if the value is falsy), then it will return all secretaries.
 * This is one of the few Cloud Functions that is necessary, since I don't want to send the entire db to the client to perform the search there.
 * @param {string} name The name of the secretary.
 * @returns {Promise<{
 * 	id: string,
 * 	fullName: string,
 * 	sex: string,
 * 	clinics: object[],
 * 	data: object,
 * 	user: object
 * }[]>} An array of the data of matching secretaries.
 */
async function search(name) {
	// Fetch the data of all the secretary documents:
	return db.collection("users").where("secretary", "==", true).get().then(secretary_snaps => {
		const secretaries = [];

		// Filter the secretaries based on whether they have matching names:
		for (const secretary_snap of secretary_snaps.docs) {
			if (!name || stringContains(secretary_snap.data().fullName, name)) {
				const data = secretary_snap.data();
				data.id = secretary_snap.id;
				secretaries.push(data);
			}
		}

		return secretaries;
	});
}

exports.search = search;