import { fb } from "../init";

// import { fn } from "../init";
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
	},

	clinics: {
		get: fn.httpsCallable("clinics-get"),
		add: fn.httpsCallable("clinics-add"),
		edit: fn.httpsCallable("clinics-edit"),
		delete: fn.httpsCallable("clinics-delete"),
		getAllDoctors: fn.httpsCallable("clinics-getAllDoctors"),
		addDoctor: fn.httpsCallable("clinics-addDoctor"),
		removeDoctor: fn.httpsCallable("clinics-removeDoctor"),
		getAllSecretaries: fn.httpsCallable("clinics-getAllSecretaries"),
		addSecretary: fn.httpsCallable("clinics-addSecretary"),
		removeSecretary: fn.httpsCallable("clinics-removeSecretary"),
		hasSecretary: fn.httpsCallable("clinics-hasSecretary"),
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

	schedules: {
		get: fn.httpsCallable("schedules-get"),
		add: fn.httpsCallable("schedules-add"),
		edit: fn.httpsCallable("schedules-edit"),
		delete: fn.httpsCallable("schedules-delete"),

		addType: fn.httpsCallable("schedules-addType"),
		editType: fn.httpsCallable("schedules-editType"),
		deleteType: fn.httpsCallable("schedules-deleteType"),
		getTypes: fn.httpsCallable("schedules-getTypes"),
		getType: fn.httpsCallable("schedules-getType"),
		
		setMinimum: fn.httpsCallable("schedules-setMinimum"),
		getMinimum: fn.httpsCallable("schedules-getMinimum"),
	},

	secretaries: {
		getData: fn.httpsCallable("secretaries-getData"),
		getAllClinics: fn.httpsCallable("secretaries-getAllClinics"),
		create: fn.httpsCallable("secretaries-create"),
		search: fn.httpsCallable("secretaries-search"),
		getID: fn.httpsCallable("secretaries-getID"),
	},

	specializations: {
		search: fn.httpsCallable("specializations-search"),
		create: fn.httpsCallable("specializations-create"),
		getAll: fn.httpsCallable("specializations-getAll"),
	},

	users: {
		get: fn.httpsCallable("users-get"),
		getPicture: fn.httpsCallable("users-getPicture"),
		updatePicture: fn.httpsCallable("users-updatePicture"),
		update: fn.httpsCallable("users-update"),
	},
}