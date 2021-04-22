// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

 async function getPicture(id) {
	let location;

	await db.collection("users").doc(id).get().then(user_snap => {
		if (user_snap.data().image) {
			location = "users/" + id + "/pictures/" + user_snap.data().image;
		}
		else if (user_snap.data().sex === "male") {
			location = "graphics/pictures/man";
		}
		else {
			location = "graphics/pictures/woman";
		}
	});

	return location;
}

async function updatePicture(id) {
	let current = 1;

	await db.collection("users").doc(id).get().then(user_snap => {
		if (user_snap.data().image) {
			current = user_snap.data().image;
		}
	});

	await db.collection("users").doc(id).update({
		image: (current + 1)
	});

	return "users/" + id + "/pictures/" + (current + 1);
}

exports.getPicture = getPicture;
exports.updatePicture = updatePicture;
