const fs = require("@google-cloud/firestore");

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const db = admin.firestore();

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
 * 
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