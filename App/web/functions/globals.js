const environment = {
	admin: require('firebase-admin')
}

const strings = {
	USERS: "users",
	CLINICS: "clinics",
	DOCTORS: "doctors",
	APPOINTMENTS: "appointments",
	TYPES: "types",
	SHIFTS: "shifts"
}

exports.environment = environment;
exports.strings = strings;