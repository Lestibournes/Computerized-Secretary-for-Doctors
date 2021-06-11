const admin = require('firebase-admin');
const functions = require('firebase-functions');

const fsdb = admin.firestore();

// Types:
const 
CLINIC = "clinic", 
DOCTOR = "doctor", 
APPOINTMENT = "appointment", 
PATIENT = "patient", 
USER = "user", 
SCHEDULE = "schedule",
LINK = "link";

// Actions:
const 
VIEW = "view", 
MODIFY = "modify";

// Messages:
const
DENIED = "Permission denied";

/**
 * Check if the current user has the right to view the clinic's private information.
 * Currently only implemented view clinic, view appointment.
 * @param {string} type can be clinic, doctor, appointment, patient, user, schedule, link
 * @param {string} action can be view, modify
 * @param {string} id the id of the object in question
 * @param {functions.https.CallableContext} context The function call's execution context, which provides the current user's id.
 * @returns {Promise<{boolean}>}
 */
async function checkPermission(type, action, id, context) {
	return fsdb.collection("users").doc(context.auth.uid).get().then(user => {
		const user_data = user.data();
		user_data.id = context.auth.uid;

		if (type === DOCTOR) {
			if (action === MODIFY) return checkDoctorModifyPermission(id, user_data);
		}

		if (type === CLINIC) {
			if (action === VIEW) return checkClinicViewPermission(id, user_data);
			if (action === MODIFY) return checkClinicModifyPermission(id, user_data);
		}
	
		if (type === APPOINTMENT) {
			if (action === VIEW) {
				return checkAppointmentViewPermission(id, user_data);
			}
		}
	
		return null;
	});
}

/**
 * Check if the current user has the right to modify the doctor's profile.
 * Only the doctor himself may modify his profile.
 * @param {string} id the id of the document being accessed.
 * @param {FirebaseFirestore.DocumentData} user The user's profile data. Modified to add the id.
 * @returns {Promise<{boolean}>}
 */
async function checkDoctorModifyPermission(id, user) {
	// If the current user is the doctor:
	return user.doctor === id;
}

/**
 * Check if the current user has the right to view the clinic's private information.
 * Allowed: the owner, employees.
 * @param {string} id the id of the clinic
 * @param {FirebaseFirestore.DocumentData} user The user's profile data. Modified to add the id.
 * @returns {Promise<{boolean}>}
 */
async function checkClinicViewPermission(id, user) {
	return fsdb.collection("clinics").doc(id).get().then(clinic => {
		return fsdb.collection("clinics").doc(id).collection("secretaries").get().then(secretariesSnapshot => {
			return fsdb.collection("clinics").doc(id).collection("doctors").get().then(doctorsSnapshot => {
				if (user.doctor) {
					// If he owns the clinic, even if he doesn't work there:
					if (clinic.data().owner === user.doctor) {
						return true;
					}
					
					// If he's doctor who currently works at the clinic, even if it's not his appointments:
					for (const doctor of doctorsSnapshot.docs) {
						if (user.doctor === doctor.id) {
							return true;
						}
					}
				}
				
				// If the user is a doctor
				if (user.secretary) {
					// If he's secretary who currently works at the clinic:
					for (const secretary of secretariesSnapshot.docs) {
						if (user.secretary === secretary.id) {
							return true;
						}
					}
				}

				return false;
			});
		});
	});
}

/**
 * Check if the current user has the right to view the clinic's private information.
 * Only the owner can modify the clinic itself. This includes address, name, employees, link as well as its very existence.
 * Perhapse it should be modularized?
 * @param {string} id the id of the clinic
 * @param {FirebaseFirestore.DocumentData} user The user's profile data. Modified to add the id.
 * @returns {Promise<{boolean}>}
 */
async function checkClinicModifyPermission(id, user) {
	return fsdb.collection("clinics").doc(id).get().then(clinic => {
		// If the user is a doctor and  owns the clinic, even if he doesn't work there:
		if (user.doctor && clinic.data().owner === user.doctor) return true;

		return false;
	});
}

/**
 * Check if the current user has the right to view the appointment.
 * Allowed: The patient, his doctor, his coworkers, his employer, the secretaries at the clinic.
 * @param {string} id the id of the appointment
 * @param {FirebaseFirestore.DocumentData} user The user's profile data. Modified to add the id.
 * @returns {Promise<{boolean}>}
 */
async function checkAppointmentViewPermission(id, user) {
	return fsdb.collection("appointments").doc(id).get().then(appointment => {
		// If it's his own appointments, even if he doesn't work in the clinic anymore:
		if (appointment.data().doctor === user.doctor ||
				appointment.data().patient === user.id) {
			return true;
		}

		return checkClinicViewPermission(appointment.data().clinic, user);
	});
}

// Types:
exports.CLINIC = CLINIC;
exports.DOCTOR = DOCTOR;
exports.APPOINTMENT = APPOINTMENT;
exports.PATIENT = PATIENT;
exports.USER = USER;
exports.SCHEDULE = SCHEDULE;
exports.LINK = LINK;

// Actions:
exports.VIEW = VIEW;
exports.MODIFY = MODIFY;

// Messages:
exports.DENIED = DENIED;

// Functions:
exports.checkPermission = checkPermission;