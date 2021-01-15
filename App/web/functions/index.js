const fs = require("@google-cloud/firestore");

// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Public interface:
exports.searchDoctors = functions.https.onCall((data, context) => {
	return searchDoctors(data.name, data.field, data.city);
});

exports.getAvailableAppointments = functions.https.onCall((data, context) => {
	return getAvailableAppointments(data.doctor, data.clinic, data.date, data.type);
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

			const end_time = {
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

	// Then get all of the time slots while leaving out the ones that are already booked:
	let slots = [];
	
	await db.collection("slots")
	.where("clinic", "==", clinic)
	.where("doctor", "==", doctor)
	.get().then(snapshots => {
		snapshots.forEach(snapshot => {
			const weekly = new Map(Object.entries(snapshot.data().weekly));
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

				while (compare_time(now, end) < 0) {
					const end_time = {
						hours: now.hours,
						minutes: now.minutes
					}

					increment_time(end_time, slot.size);
					
					let okay = 1;

					appointments.forEach(appointment => {
						if ((compare_time(now, appointment.start) >= 0 && compare_time(now, appointment.end) < 0) || (compare_time(end_time, appointment.start) >= 0 && compare_time(end_time, appointment.end) < 0)) {
							okay = 0;
							return;
						}
					});

					if (okay) {
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
		});
	});

	console.log(slots);
	// Return the available time slots:
	return slots;
}