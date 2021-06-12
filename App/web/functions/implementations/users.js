// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const fsdb = admin.firestore();

async function add(user, firstName, lastName, context) {
	response = {
		success: false,
		message: ""
	}

	return fsdb.collection("users").doc(user).set({
		firstName: firstName,
		lastName: lastName
	}).then(() => {
		response.success = true;
		return response;
	});
}

async function get(user) {
	return fsdb.collection("users").doc(user).get().then(user_snap => {
		if (user_snap.exists) {
			const data = user_snap.data();
			data.id = user_snap.id;
			data.fullName = data.firstName + " " + data.lastName;
			return data;
		}
		else return false;
	});
}

async function getPicture(id) {
	let location;

	await fsdb.collection("users").doc(id).get().then(user_snap => {
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

	await fsdb.collection("users").doc(id).get().then(user_snap => {
		if (user_snap.data().image) {
			current = user_snap.data().image;
		}
	});

	await fsdb.collection("users").doc(id).update({
		image: (current + 1)
	});

	return "users/" + id + "/pictures/" + (current + 1);
}

async function update(id, changes) {
	fsdb.collection("users").doc(id).update(changes);
}

async function isDoctor(id) {
	return fsdb.collection("users").doc(id).get().then(user_snap => {
		return user_snap.data().doctor === id;
	});
}

async function isSecretary(id) {
	return fsdb.collection("users").doc(id).get().then(user_snap => {
		return user_snap.data().secretary === id;
	});
}

exports.add = add;
exports.get = get;
exports.getPicture = getPicture;
exports.updatePicture = updatePicture;
exports.update = update;
exports.isDoctor = isDoctor;
exports.isSecretary = isSecretary;