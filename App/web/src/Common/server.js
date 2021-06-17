import { db, fb } from "../init";
// import { usePopups } from "./Popups";

export const fn = fb.functions();

export const server = {
	appointments: {
		// get: fn.httpsCallable("appointments-get"),
		// getAll: fn.httpsCallable("appointments-getAll"),
		getAvailable: fn.httpsCallable("appointments-getAvailable"),
		// add: fn.httpsCallable("appointments-add"),
		// edit: fn.httpsCallable("appointments-edit"),
		// cancel: fn.httpsCallable("appointments-cancel"),
		// arrived: fn.httpsCallable("appointments-arrived"),
		// saveNote: fn.httpsCallable("appointments-saveNote"),
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

	links: {
		getLink: fn.httpsCallable("links-getLink"),
		getTarget: fn.httpsCallable("links-getTarget"),
		register: fn.httpsCallable("links-register"),
		isAvailable: fn.httpsCallable("links-isAvailable"),
	},
}

export const events = {
	clinics: {
		/**
	 * For watching changes in the patient arrival status for one specific appointment.
	 * @param {string} appointment the id of the appointment.
	 * @param {(oldData: firebase.firestore.DocumentData, newData: firebase.firestore.DocumentData) => {}} callback Includes the id of the appointment and all the data of the appoinemnt document.
	 * @returns unsubscribe function.
	 */
		appointment: function(clinic, appointment, callback) {
			if (!this.appointments.cache) this.appointments.cache = new Map();
			
			return db.collection("clinics").doc(clinic).collection("appointments").doc(appointment).onSnapshot(
				app_snap => {
					const key = clinic + "/" + appointment;
					const newData = app_snap.data();
					newData.id = appointment;

					if (app_snap.data()) {
						if (!this.appointments.cache.has(key)) {
							this.appointments.cache.set(key, newData);
						}
						
						callback(this.appointments.cache.get(key), newData.arrived);
						this.appointments.cache.set(key, newData);
					}
					else {
						this.appointments.cache.delete(key);
					}
				}
			);
		}
	},

	doctors: {
		appointments: function(doctor, callback) {
			if (!this.appointments.cache) this.appointments.cache = new Map();
			
			return db.collectionGroup("appointments").where("doctor", "==", doctor).onSnapshot(
				app_snaps => {
					for (const change_snap of app_snaps.docChanges()) {
						const key = change_snap.doc.data().clinic + "/" + change_snap.doc.id;
						const newData = change_snap.doc.data();
						newData.id = change_snap.doc.id;
						
						if (change_snap.type === "added") this.appointments.cache.set(key, newData);
		
						if (change_snap.type === "deleted") this.appointments.cache.delete(key);
		
						if (change_snap.type === "modified") {
							callback(this.appointments.cache.get(key), newData);	
							this.appointments.cache.set(key, newData);
						}
					}
				},
				error => console.log("Can't fetch notifications: " + error.message)
			);
		}
	}
}