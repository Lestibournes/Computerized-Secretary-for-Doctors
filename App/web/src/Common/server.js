import { db, fb } from "../init";
// import { usePopups } from "./Popups";

export const fn = fb.functions();

export const server = {
	appointments: {
		getAvailable: fn.httpsCallable("appointments-getAvailable"),
		addAppointment: fn.httpsCallable("appointments-addAppointment"),
		updateAppointment: fn.httpsCallable("appointments-updateAppointment"),
	},

	doctors: {
		search: fn.httpsCallable("doctors-search"),
	},

	secretaries: {
		search: fn.httpsCallable("secretaries-search"),
	},
}

export const events = {
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