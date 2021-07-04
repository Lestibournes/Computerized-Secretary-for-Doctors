const firebase = require('@firebase/testing');

const projectId = "csfpd-da7e7";

// Represents the currently logged-in user and his data:
const thisAuth = {
	email: "john.doe@csfpd.com",
	uid: "testing123"
}

const thisUserData = {
	firstName: "John",
	lastName: "Doe",
	fullName: "John Doe",
	sex: "male"
}

const thisClinicData = {
	name: "Smiles",
	city: "Jerusalem",
	address: "613 Jaffa St.",
	owner: thisAuth.uid
}

// Represents another random user that is not the current user, and her data:
const otherAuth = {
	email: "jane.smith@csfpd.com",
	uid: "testing321"
}

const otherUserData = {
	firstName: "Jane",
	lastName: "Smith",
	fullName: "Jane Smith",
	sex: "female"
}

const otherClinicData = {
	name: "חיוכים",
	city: "ירושלים",
	address: "רחוב יפו 613",
	owner: otherAuth.uid
}


/**
 * Get a testing instance of the firestore with the provided fake user auth object as the signed-in user.
 * @param {{uid: string}} auth The auth data for the current user. Most importantly must contain some uid.
 * @returns {firebase.firestore.Firestore}
 */
 function getFirestore(auth) {
	return firebase.initializeTestApp({projectId: projectId, auth: auth}).firestore();
}

/**
 * Get a testing admin instance of the firestore.
 * @returns {firebase.firestore.Firestore}
 */
function getAdminFirestore() {
	return firebase.initializeAdminApp({projectId: projectId}).firestore();
}

exports.projectId = projectId;

exports.thisAuth = thisAuth;
exports.thisUserData = thisUserData;
exports.thisClinicData = thisClinicData;

exports.otherAuth = otherAuth;
exports.otherUserData = otherUserData;
exports.otherClinicData = otherClinicData;

exports.getFirestore = getFirestore;
exports.getAdminFirestore = getAdminFirestore;