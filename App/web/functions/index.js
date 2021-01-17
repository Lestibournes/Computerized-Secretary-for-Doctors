const fs = require("@google-cloud/firestore");

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
const { ArraySchema } = require("yup");

admin.initializeApp();
const db = admin.firestore();

const day_names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Public interface:
exports.searchDoctors = functions.https.onCall((data, context) => {
	return searchDoctors(data.name, data.field, data.city);
});

exports.getAvailableAppointments = functions.https.onCall((data, context) => {
	return getAvailableAppointments(data.doctor, data.clinic, data.date, data.type);
});

exports.makeAppointment = functions.https.onCall((data, context) => {
	return makeAppointment(data.doctor, data.clinic, data.date, data.time, data.type);
});

// Helper methods:
const stringContains = (text, search) => {
	let src = (String) (text);
	let term = (String) (search);

	for (let i = 0; i < src.length; i++) {
		if (src.substr(i, term.length).toLowerCase() === term.toLowerCase()) {
			return true;
		}
	}

	return false;
}

const compare_time = (now, then) => {
	if (now.hours > then.hours || (now.hours == then.hours && now.minutes > then.minutes)) return 1;
	else if (now.hours == then.hours && now.minutes == then.minutes) return 0;
	else return -1;
};

const increment_time = (now, minutes) => {
	now.minutes += minutes;
	now.hours += Math.floor(now.minutes / 60);
	now.minutes %= 60;
};

/**
Get all occupied time slots for a specified date.

@param doctor is the id of the doctor
@param clinic is the id of the clinic
@param date is an object with the following numerical fields: day, month, year
**/
async function getAppointments(doctor, clinic, date) {
	// The time from the server is in UTC with no timezone offset data.

	// Set the time range for the appointments to be exactly the day in question:
	const start_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day));
	const end_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day + 1));
	const week_day = new Date(date.year, date.month, date.day).getDay();

	// First get all of the booked time ranges:
	const appointments = [];

	await db.collection("appointments")
	.where("clinic", "==", clinic)
	.where("doctor", "==", doctor)
	.where("start", ">=", start_day)
	.where("start", "<", end_day)
	.get().then(snapshots => {
		snapshots.forEach(snapshot => {
			const start_time = {
				hours: snapshot.data().start.toDate().getHours(),
				minutes: snapshot.data().start.toDate().getMinutes()
			};

			let end_time = {
				hours: start_time.hours,
				minutes: start_time.minutes
			}

			increment_time(end_time, snapshot.data().duration);

			appointments.push({
				start: start_time,
				end: end_time
			});
		});
	});

	return appointments;
}

// Check if the speciefied time slot is available.
// Return 1 if there is a collision, 1 if there isn't.
const appointmentCollides = (appointments, start, end) => {
	let collides = 0;
	
	if (appointments.length > 0) {
		appointments.forEach(appointment => {
			if ((compare_time(start, appointment.start) >= 0 && compare_time(start, appointment.end) < 0) ||
					(compare_time(end, appointment.start) >= 0 && compare_time(end, appointment.end) < 0)) {
				collides = 1;
				return;
			}
		});
	}

	return collides;
}

async function isAvailable(doctor, clinic, date, time, type) {
	const appointments = getAppointments(doctor, clinic, date);
	let okay = 0;
	let slots = [];
	
	await db.collection("slots")
	.where("clinic", "==", clinic)
	.where("doctor", "==", doctor)
	.get().then(snapshots => {
		snapshots.forEach(snapshot => {
			const weekly = new Map(Object.entries(snapshot.data().weekly));
			
			if (weekly.has(day_names[week_day])) {
				const schedule = weekly.get(day_names[week_day]);

				schedule.forEach(slot => {
					const now = {
						hours: slot.start.toDate().getHours(),
						minutes: slot.start.toDate().getMinutes()
					}
	
					const end = {
						hours: slot.end.toDate().getHours(),
						minutes: slot.end.toDate().getMinutes()
					}

					if (compare_time(time.start, now) >= 0 && compare_time(time.end, end) <= 0 && appointmentCollides(appointments, time.start, time.end) == 0) {
						okay = 1;
						return;
					}
				});
			}
		});
	});

	// Return the available time slots:
	return slots;
}

// API implementation code:

// Get all doctors and then filter the results by name, field of specialization, and the city where their clinic is.
// All params are optional. If no parameters are specified (or if the value is falsy), then it will return all doctors.
async function searchDoctors(name, field, city) {
	// First get all the doctors:
	const doctors = [];

	await db.collection("doctors").get().then(snapshots => {
		snapshots.forEach(snapshot => {
			doctors.push({
				id: null, //user id
				user: null, //user data
				doctor: snapshot.data(), //doctor data
				clinics: [], //list of clinics in the specified city
				fields: [], //list of doctor specializations that match the requested specialization
			});
		});
	});
	
	for (const doctor of doctors) {
		// Get the user data from refs:
		await doctor.doctor.user.get().then(user_snapshot => {
			doctor.id = user_snapshot.id;
			doctor.user = user_snapshot.data();
		});

		// Check if the name is unspecified or is a match:
		let fullName = doctor.user.firstName + " " + doctor.user.lastName;

		// Only consider doctors who's name is a match or not specified:
		if ((name && stringContains(fullName, name)) || !name) {
			// Get the field data for the given doctor:
			for (i in doctor.doctor.fields) {
				await doctor.doctor.fields[i].get().then(field_snapshot => {
					// Check if the field is unspecified or is a match:
					if ((field && stringContains(field_snapshot.id, field)) || !field) {
						doctor.fields.push(field_snapshot.id);
					}
				});
			}

			// Get the clinic data for the given doctor:
			for (i in doctor.doctor.clinics) {
				await doctor.doctor.clinics[i].get().then(clinic_snapshot => {
					// Check if the field is unspecified or is a match:
					if ((city && stringContains(clinic_snapshot.data().city, city)) || !city) {
						let temp = clinic_snapshot.data();
						temp.id = clinic_snapshot.id;
						doctor.clinics.push(temp);
					}
				});
			};
		}
	}

	// Only add to the results the doctors who have both fields and clinics that are a match:
	const results = [];
	for (const doctor of doctors) {
		if (doctor.clinics.length > 0 && doctor.fields.length > 0) {
			results.push(doctor);
		}
	}

	return results;
}
/*
Get all available time slots for a specified date.
If appointment type is specified then it will get only time slots that are big enough to accomodate it.

@param doctor is the id of the doctor
@param clinic is the id of the clinic
@param date is an object with the following numerical fields: day, month, year
@param type is a string identifying the type of appointment
*/
async function getAvailableAppointments(doctor, clinic, date, type) {
	// The time from the server is in UTC with no timezone offset data.
	const day_names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

	//Set the time range for the appointments to be exactly the day in question:
	const start_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day));
	const end_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day + 1));
	const week_day = new Date(date.year, date.month, date.day).getDay();

	// First get all of the booked time ranges:
	let appointments = await getAppointments(doctor, clinic, date);

	// Then get all of the time slots while leaving out the ones that are already booked:
	let slots = [];
	
	await db.collection("slots")
	.where("clinic", "==", clinic)
	.where("doctor", "==", doctor)
	.get().then(snapshots => {
		snapshots.forEach(snapshot => {
			const weekly = new Map(Object.entries(snapshot.data().weekly));
			
			if (weekly.has(day_names[week_day])) {
				const schedule = weekly.get(day_names[week_day]);

				schedule.forEach(slot => {
					let now = {
						hours: slot.start.toDate().getHours(),
						minutes: slot.start.toDate().getMinutes()
					}
	
					const end = {
						hours: slot.end.toDate().getHours(),
						minutes: slot.end.toDate().getMinutes()
					}
	
					while (compare_time(now, end) < 0) {
						let end_time = {
							hours: now.hours,
							minutes: now.minutes
						}
	
						increment_time(end_time, slot.size);
	
						if (appointmentCollides(appointments, now, end_time) == 0) {
							slots.push({
								start: {
									hours: now.hours,
									minutes: now.minutes
								},
								end: {
									hours: end_time.hours,
									minutes: end_time.minutes
								}
							});
						}
	
						increment_time(now, slot.size);
					}
				});
			}
		});
	});

	// Return the available time slots:
	return slots;
}

function makeAppointment(doctor, clinic, date, time, type) {
	const appointments = getAppointments(doctor, clinic, date);

	if (isAvailable(doctor, clinic, date, time, type)) {
		return db.collection("appointments").add({
			clinic: clinic,
			doctor: doctor,
			type: type,
			start: new Date(date.year, date.month, date.day, time.hours, time.minutes, 0),
			patient: null,
			duration: 15
		})
	}
}