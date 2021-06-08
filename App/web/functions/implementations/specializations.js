// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const fsdb = admin.firestore();

const NAME = "fields";

async function search(text) {
	return fsdb.collection(NAME).get().then(response => {
		const specializations = [];

		for (let doc of response.docs) {
			if (doc.id.toLowerCase().includes(text.toLowerCase())) {
				const data = doc.data();
				data.id = doc.id; 
				specializations.push(data);
			}
		}

		return specializations;
	});
}

async function getAll() {
	
	return fsdb.collection(NAME).get().then(spec_snaps => {
		let specializations = [];

		spec_snaps.forEach(spec => {
			specializations.push({
				id: spec.id,
				label: String(spec.id).split(" ").map(word => {
					return String(word)[0].toLocaleUpperCase() + String(word).slice(1) + " ";
				})
			});
		});

		return specializations;
	});
}

async function create(name) {
	return fsdb.collection(NAME).doc(name).create({
		exists: true
	});
}

exports.search = search;
exports.create = create;
exports.getAll = getAll;
exports.NAME = NAME;