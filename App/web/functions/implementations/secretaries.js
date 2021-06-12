// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const fsdb = admin.firestore();

const stringContains = require('./functions').stringContains;

/**
 * Get the requested secretary.
 * @todo Be more picky about which data is being returned.
 * @param {string} secretary The id of the secretary.
 * @returns {Promise<{
 * 	id: string,
 * 	fullName: string,
 * 	sex: string,
 * 	clinics: object[],
 * 	data: object,
 * 	user: object
 * }>} The data of the requested secretary.
 */
async function getData(secretary) {
	return fsdb.collection("secretaries").doc(secretary).get().then(secretary_snapshot => {
		const result = {
			id: secretary,
			fullName: "",
			sex: "",
			data: secretary_snapshot.data(), // The secretary data.
			user: null, // The user data.
			clinics: [], // An array of the data of all the clinics that employ this secretary.
		};
		
		const promises = [];
		// Get the user data:
		promises.push(
			fsdb.collection("users").doc(result.data.user).get().then(user_snapshot => {
				result.user = user_snapshot.data();
				result.user.id = user_snapshot.id;
				result.fullName = user_snapshot.data().firstName + " " + user_snapshot.data().lastName;
				result.sex = user_snapshot.data().sex;
			})
		);

		// Get the clinic data for the given secretary:
		promises.push(
			getAllClinics(secretary).then(clinics => {
				result.clinics = clinics;
			})
		);
	
		return Promise.all(promises).then(() => {
			return result;
		});
	});
}

/**
 * Get the data of all the clinics of the specified secretary.
 * @param {string} secretary the id of the secretary
 * @returns {Promise<object[]>} an array of the data of all the clinics that the secretary works in.
 */
async function getAllClinics(secretary) {
	// Get the clinic data for the given secretary:
	return fsdb.collection("secretaries").doc(secretary).collection("clinics").get().then(clinic_snaps => {
		const clinic_promises = [];

		for (const clinic_snap of clinic_snaps.docs) {
			clinic_promises.push(
				fsdb.collection("clinics").doc(clinic_snap.id).get().then(clinic_snapshot => {
					if (clinic_snapshot.data()) {
						let clinic_data = clinic_snapshot.data();
						clinic_data.id = clinic_snapshot.id;
						return clinic_data;
					}
				})
			);
		};

		return Promise.all(clinic_promises).then(clinics => {
			const results = [];

			for (const clinic of clinics) {
				if (clinic) results.push(clinic);
			}
			
			return results;
		});
	});
}

/**
 * Create a new secretary profile for the given user, on the condition that he doesn't already have one.
 * @param {string} user The id of the user.
 * @returns {Promise<{secretary: string, success: boolean}>} The id of the user's current secretary profile and whether a new secretary profile was created.
 */
async function create(user) {
	let result = {
		secretary: null,
		success: false
	};

	return fsdb.collection("users").doc(user).get().then(user_snap => {
		if (!user_snap.data().secretary) {
			// If the user doesn't have a secretary profile then create a profile:
			return fsdb.collection("secretaries").doc(user).set({
				user: user
			}).then(() => {
				// Add the secretary profile to the user:
				return fsdb.collection("users").doc(user).update({
					secretary: user
				}).then(() => {
					result.secretary = user;
					result.success = true;

					return result;
				});
			});
		}
	
		// If the user does have a secretary profile, then return the existing profile:
		result.secretary = user_snap.data().secretary;
	
		return result;
	});
}

/**
 * Get all secretaries and then filter the results by name.
 * All params are optional. If no parameters are specified (or if the value is falsy), then it will return all secretaries.
 * @todo Change the format of the data that is being returned and be more picky about which data is being returned.
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
	const promises = [];
	
	return fsdb.collection("secretaries").get().then(secretary_snapshots => {
		for (const secretary_snapshot of secretary_snapshots.docs) {
			promises.push(getData(secretary_snapshot.id));
		}

		return Promise.all(promises).then(results => {
			const secretaries = [];

			// Filter the secretaries based on whether they have matching names:
			for (const result of results) {
				if ((name && stringContains(result.user.fullName, name)) || !name) {
					secretaries.push(result);
				}
			}

			return secretaries;
		});
	});
}

/**
 * Get the id of the given user's secretary profile.
 * @param {string} user The id of the user
 * @returns {Promise<string>} the id of the secretary profile for the given user.
 * Null if he doesn't have one.
 */
async function getID(user) {
	return fsdb.collection("users").doc(user).get().then(user_snap => {
		if (user_snap.data().secretary) return user_snap.data().secretary;

		return null;
	});
}

exports.getData = getData;
exports.getAllClinics = getAllClinics;
exports.create = create;
exports.search = search;
exports.getID = getID;