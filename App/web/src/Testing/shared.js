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

const thisTypesData = [
	{
		duration: 1,
		name: "Follow Up"
	},
	{
		duration: 2,
		name: "Regular"
	},
	{
		duration: 3,
		name: "New Patient"
	},
]

const thisShiftData = [
	{
		day: 0,
		start: {
			hours: 9,
			minutes: 0
		},
		end: {
			hours: 13,
			minutes: 0
		}
	},
	{
		day: 0,
		start: {
			hours: 14,
			minutes: 0
		},
		end: {
			hours: 18,
			minutes: 30
		}
	},

	{
		day: 1,
		start: {
			hours: 8,
			minutes: 30
		},
		end: {
			hours: 12,
			minutes: 30
		}
	},
	{
		day: 1,
		start: {
			hours: 13,
			minutes: 0
		},
		end: {
			hours: 18,
			minutes: 0
		}
	},
	
	{
		day: 2,
		start: {
			hours: 9,
			minutes: 0
		},
		end: {
			hours: 13,
			minutes: 0
		}
	},
	{
		day: 2,
		start: {
			hours: 14,
			minutes: 0
		},
		end: {
			hours: 18,
			minutes: 30
		}
	},

	{
		day: 3,
		start: {
			hours: 8,
			minutes: 30
		},
		end: {
			hours: 12,
			minutes: 30
		}
	},
	{
		day: 3,
		start: {
			hours: 13,
			minutes: 0
		},
		end: {
			hours: 18,
			minutes: 0
		}
	},
	
	{
		day: 4,
		start: {
			hours: 9,
			minutes: 0
		},
		end: {
			hours: 13,
			minutes: 0
		}
	},
	{
		day: 4,
		start: {
			hours: 14,
			minutes: 0
		},
		end: {
			hours: 18,
			minutes: 30
		}
	},

	{
		day: 5,
		start: {
			hours: 8,
			minutes: 30
		},
		end: {
			hours: 12,
			minutes: 30
		}
	},
]

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

const otherTypesData = [
	{
		duration: 1,
		name: "עוקב"
	},
	{
		duration: 2,
		name: "רגיל"
	},
	{
		duration: 3,
		name: "ראשון"
	},
]

const otherShiftData = [
	{
		day: 0,
		start: {
			hours: 10,
			minutes: 30
		},
		end: {
			hours: 14,
			minutes: 30
		}
	},
	{
		day: 0,
		start: {
			hours: 15,
			minutes: 30
		},
		end: {
			hours: 19,
			minutes: 45
		}
	},
	
	{
		day: 1,
		start: {
			hours: 9,
			minutes: 20
		},
		end: {
			hours: 12,
			minutes: 50
		}
	},
	{
		day: 1,
		start: {
			hours: 13,
			minutes: 45
		},
		end: {
			hours: 18,
			minutes: 45
		}
	},
	
	{
		day: 2,
		start: {
			hours: 10,
			minutes: 30
		},
		end: {
			hours: 14,
			minutes: 30
		}
	},
	{
		day: 2,
		start: {
			hours: 15,
			minutes: 30
		},
		end: {
			hours: 19,
			minutes: 45
		}
	},
	
	{
		day: 3,
		start: {
			hours: 9,
			minutes: 20
		},
		end: {
			hours: 12,
			minutes: 50
		}
	},
	{
		day: 3,
		start: {
			hours: 13,
			minutes: 45
		},
		end: {
			hours: 18,
			minutes: 45
		}
	},
	
	{
		day: 4,
		start: {
			hours: 10,
			minutes: 30
		},
		end: {
			hours: 14,
			minutes: 30
		}
	},
	{
		day: 4,
		start: {
			hours: 15,
			minutes: 30
		},
		end: {
			hours: 19,
			minutes: 45
		}
	},
	
	{
		day: 5,
		start: {
			hours: 8,
			minutes: 10
		},
		end: {
			hours: 13,
			minutes: 25
		}
	},
]

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

/**
 * Get a testing instance of Cloud Functions with the provided fake user auth object as the signed-in user.
 * @param {{uid: string}} auth The auth data for the current user. Most importantly must contain some uid.
 * @returns {globalThis.firebase.functions.Functions}
 */
 function getFunctions(auth) {
	return firebase.initializeTestApp({projectId: projectId, auth: auth}).functions();
}

/**
 * Get a testing admin instance of the Cloud Functions.
 * @returns {globalThis.firebase.functions.Functions}
 */
 function getAdminFunctions() {
	return firebase.initializeAdminApp({projectId: projectId}).functions();
}

exports.projectId = projectId;

exports.thisAuth = thisAuth;
exports.thisUserData = thisUserData;
exports.thisClinicData = thisClinicData;
exports.thisTypesData = thisTypesData;
exports.thisShiftData = thisShiftData;

exports.otherAuth = otherAuth;
exports.otherUserData = otherUserData;
exports.otherClinicData = otherClinicData;
exports.otherTypesData = otherTypesData;
exports.otherShiftData = otherShiftData;

exports.getFirestore = getFirestore;
exports.getAdminFirestore = getAdminFirestore;
exports.getFunctions = getFunctions;
exports.getAdminFunctions = getAdminFunctions;