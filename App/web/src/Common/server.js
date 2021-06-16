import { db, fb } from "../init";
import { usePopups } from "./Popups";

export const fn = fb.functions();

export const server = {
	appointments: {
		get: fn.httpsCallable("appointments-get"),
		getAll: fn.httpsCallable("appointments-getAll"),
		getAvailable: fn.httpsCallable("appointments-getAvailable"),
		add: fn.httpsCallable("appointments-add"),
		edit: fn.httpsCallable("appointments-edit"),
		cancel: fn.httpsCallable("appointments-cancel"),
		arrived: fn.httpsCallable("appointments-arrived"),
		saveNote: fn.httpsCallable("appointments-saveNote"),
	},

	clinics: {
		get: fn.httpsCallable("clinics-get"),
		add: fn.httpsCallable("clinics-add"),
		edit: fn.httpsCallable("clinics-edit"),
		delete: fn.httpsCallable("clinics-delete"),

		getAllDoctors: fn.httpsCallable("clinics-getAllDoctors"),
		addDoctor: fn.httpsCallable("clinics-addDoctor"),
		removeDoctor: fn.httpsCallable("clinics-removeDoctor"),
		
		getAllCities: fn.httpsCallable("clinics-getAllCities"),
		getAppointments: fn.httpsCallable("clinics-getAppointments"),
	},

	doctors: {
		getData: fn.httpsCallable("doctors-getData"),
		getAllClinics: fn.httpsCallable("doctors-getAllClinics"),
		create: fn.httpsCallable("doctors-create"),
		search: fn.httpsCallable("doctors-search"),
		getID: fn.httpsCallable("doctors-getID"),
		addSpecialization: fn.httpsCallable("doctors-addSpecialization"),
		removeSpecialization: fn.httpsCallable("doctors-removeSpecialization"),
		getAppointments: fn.httpsCallable("doctors-getAppointments"),
	},

	secretaries: {
		search: fn.httpsCallable("secretaries-search"),
	},

	specializations: {
		search: fn.httpsCallable("specializations-search"),
		create: fn.httpsCallable("specializations-create"),
		getAll: fn.httpsCallable("specializations-getAll"),
	},

	users: {
		add: fn.httpsCallable("users-add"),
		get: fn.httpsCallable("users-get"),
		getPicture: fn.httpsCallable("users-getPicture"),
		updatePicture: fn.httpsCallable("users-updatePicture"),
		update: fn.httpsCallable("users-update"),
		isDoctor: fn.httpsCallable("users-isDoctor"),
	},

	links: {
		getLink: fn.httpsCallable("links-getLink"),
		getTarget: fn.httpsCallable("links-getTarget"),
		register: fn.httpsCallable("links-register"),
		isAvailable: fn.httpsCallable("links-isAvailable"),
	},
}

export const events = {
	appointments: {
		/**
	 * For watching changes in the patient arrival status for one specific appointment.
	 * @param {string} appointment the id of the appointment.
	 * @param {(appointment: string, arrived: [boolean, string]) => {}} callback 
	 * @returns unsubscribe function.
	 */
		arrival: function(appointment, callback) {
			// const popups = usePopups();

			if (!this.arrival.cache) this.arrival.cache = new Map();
			
			return db.collection("appointments").doc(appointment).onSnapshot(
				snapshot => {
					if (snapshot.data()) {
						if (!this.arrival.cache.has(appointment)) {
							this.arrival.cache.set(appointment, snapshot.data());
						}
						
						if (snapshot.data().arrived !== this.arrival.cache.get(appointment)?.arrived) {
							callback(appointment, snapshot.data().arrived);
							this.arrival.cache.set(appointment, snapshot.data());
						}
					}
					else {
						this.arrival.cache.delete(appointment);
					}
				},
				// error => {popups.error(error.message)}
			);
		}
	},
	doctors: {
		arrival: function(doctor, callback) {
			// const popups = usePopups();
			
			if (!this.arrival.cache) this.arrival.cache = new Map();

			return db.collection("doctors").doc(doctor).collection("appointments").onSnapshot(
				appointments => {
					appointments.docChanges().forEach(change => {
						if (change.type === "removed") {
							this.arrival.cache.delete(change.doc.id);
						}

						if (change.type === "added") {
							this.arrival.cache.set(change.doc.id, change.doc.data());
						}

						if (change.type === "modified" &&
								change.doc.data().arrived !== this.arrival.cache.get(change.doc.id).arrived) {
							callback(change.doc.id, change.doc.data().arrived);
							this.arrival.cache.set(change.doc.id, change.doc.data());
						}
					});
				},
				// error => popups.error(error.message)
			);
		}
	}
}