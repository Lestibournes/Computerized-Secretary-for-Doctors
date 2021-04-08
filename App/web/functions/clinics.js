const fs = require("@google-cloud/firestore");

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

exports.get = functions.https.onCall((data, context) => {
	return get(data.id);
});

exports.getAll = functions.https.onCall((data, context) => {
	return getAll(data.doctor);
});

exports.add = functions.https.onCall((data, context) => {
	return add(data.doctor, data.name, data.city, data.address);
});

exports.edit = functions.https.onCall((data, context) => {
	return edit(data.id, data.doctor, data.name, data.city, data.address);
});

exports.leave = functions.https.onCall((data, context) => {
	return leave(data.clinic, data.doctor);
});

/**
 * Get the data of a specific clinic.
 * @param {string} id the id of the requested clinic.
 * @returns the data of the requested clinic.
 */
 async function get(id) {
	let clinic;

	console.log(id);

	await db.collection("clinics").doc(id).get().then(snap => {
		clinic = snap.data();
		clinic.id = snap.id;
	});

	return clinic;
}

/**
 * Get the data of all the clinics of the specified doctor.
 * @param {string} doctor the id of the doctor
 * @returns {object[]} an array of the data of all the clinics that the doctor works in.
 */
 async function getAll(doctor) {
	console.log(doctor);
	const clinic_data = [];

	let clinic_ids = [];
	await db.collection("doctors").doc(doctor).get().then(doctor_snap => {
		if (doctor_snap.data().clinics) {
			clinic_ids = doctor_snap.data().clinics;
		}
	});

	for (let clinic_id of clinic_ids) {
		await db.collection("clinics").doc(clinic_id).get().then(clinic_snap => {
			const clinic = clinic_snap.data();
			clinic.id = clinic_snap.id;

			clinic_data.push(clinic);
		});
	}

	return clinic_data;
}

/**
 * Create a new clinic.
 * @param {string} doctor The id of the doctor that the clinic will belong to.
 * @param {string} name The name of the clinic.
 * @param {string} city The city where the clinic is located.
 * @param {string} address The street and building number where the clinic is located.
 */
async function add(doctor, name, city, address) {
	let clinics = [];
	
	await db.collection("doctors").doc(doctor).get().then(doctor_snap => {
		if (doctor_snap.data().clinics) {
			clinics = doctor_snap.data().clinics;
		}
	});

	await db.collection("clinics").add({
		doctors: [doctor],
		name: name,
		city: city,
		address: address,
		owner: doctor
	}).then(clinicRef => {
		clinics.push(clinicRef.id);
	});

	await db.collection("doctors").doc(doctor).update({
		clinics: clinics
	});
}

/**
 * Edit the details of an existing clinic.
 * @param {string} id The id of the clinic.
 * @param {string} doctor The doctor who is requesting the change.
 * @param {string} name The new name of the clinic.
 * @param {string} city The new city where the clinic is located.
 * @param {string} address The new street name and building number where the clinic is located.
 * @returns 
 */
async function edit(id, doctor, name, city, address) {
	const response = {
		success: false,
		message: ""
	};

	let owner;

	await db.collection("clinics").doc(id).get().then(clinic_snap => {
		owner = clinic_snap.data().owner;
	});

	if (owner === doctor) {
		await db.collection("clinics").doc(id).update({
			name: name,
			city: city,
			address: address
		});

		response.success = true;
	}
	else {
		response.message = "It's not your clinic.";
	}

	return response;
}

/**
 * Have a doctor leave a clinic in which he works (does not change ownership of the clinic).
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 */
async function leave(clinic, doctor) {
	
	// Remove the doctor from the clinic:
	
	let old_doctors = [];
	let new_doctors = [];
	let update = false;
	
	await db.collection("clinics").doc(clinic).get().then(clinic_snap => {
		old_doctors = clinic_snap.data().doctors;
	});
	
	for (let i = 0; i < old_doctors.length; i++) {
		if (old_doctors[i] !== doctor) {
			new_doctors.push(old_doctors[i]);
		}
		else {
			update = true;
		}
	}

	if (update) {
		await db.collection("clinics").doc(clinic).update({
			doctors: new_doctors
		});
	}

	update = false;

	// Remove the clinic from the doctor:

	let old_clinics = [];
	let new_clinics = [];
	
	await db.collection("doctors").doc(doctor).get().then(doctor_snap => {
		old_clinics = doctor_snap.data().clinics
	});
	for (let i = 0; i < old_clinics.length; i++) {
		if (old_clinics[i] !== clinic) {
			new_clinics.push(old_clinics[i]);
		}
		else {
			update = true;
		}
	}
	
	if (update) {
		await db.collection("doctors").doc(doctor).update({
			clinics: new_clinics
		});
	}
}