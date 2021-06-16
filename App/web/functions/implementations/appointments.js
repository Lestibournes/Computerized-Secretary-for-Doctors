const functions = require('firebase-functions');
const fs = require("@google-cloud/firestore");

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

/**
 * Convenience global variable for accessing the Admin Firestore object.
 */
const fsdb = admin.firestore();

const doctors = require("./doctors");
const clinics = require("./clinics");
const schedules = require("./schedules");
const users = require("./users");
const secretaries = require("./secretaries");
const permissions = require("./permissions");

const NAME = "appointments";
/**
 * @todo Make the 2 classes files identical and get rid of the redundancy:
 */

const Time = require("./Time").Time;
const Slot = require("./Slot").Slot;
const SimpleDate = require("./SimpleDate").SimpleDate;

// Helper functions
/**
 * Get all occupied time slots for a specified date.
 * @param {string} doctor The id of the doctor
 * @param {string} clinic The id of the clinic
 * @param {SimpleDate} date The day in question
 * @returns {Promise<Slot[]>} Array of occupied time slots.
 */
async function getAppointments(doctor, clinic, date) {
	// The time from the server is in UTC with no timezone offset data.
	// The client will have to implement the timezone offset in the display.

	// Set the time range for the appointments to be exactly the day in question:
	const start_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day));
	const end_day = fs.Timestamp.fromDate(new Date(date.year, date.month, date.day + 1));

	return fsdb.collection("clinic").doc(clinic).collection("appointments").orderBy("start")
	.where("start", ">=", start_day)
	.where("start", "<", end_day)
	.where("doctor", "==", doctor)
	.get().then(appointment_snaps => {
		const appointments = [];

		for (const appointment_snap of appointment_snaps.docs) {
			const start_time = Time.fromDate(appointment_snap.data().start.toDate());
			const end_time = start_time.incrementMinutes(appointment_snap.data().duration);

			appointments.push(new Slot(start_time, end_time));
		}

		return appointments;
	});
}

/**
 * Check if the speciefied time slot is available.
 * @param {Slot[]} appointments An array of time slots that have already been booked.
 * @param {Slot} slot
 * @returns {boolean} Return true if there is a collision, false if there isn't.
 */
function appointmentCollides(appointments, slot) {
	if (appointments.length > 0) {
		for (const appointment of appointments) {
			if (slot.collides(appointment)) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Check if the specified time slot if available.
 * @todo Consider switching to using Slot instead of time and type.
 * @todo Switch to using SimpleDate, Time, and Slot objects instead of ad-hoc objects.
 * @param {string} doctor The id of the doctor for which the appointment is being requested.
 * @param {string} clinic The id of the clinic for which the appointment is being requested.
 * @param {SimpleDate} date The requested date of the appointment.
 * @param {Slot} slot The requested time of the appointment.
 * @param {string} type The type of appointment.
 * @returns {Promise<boolean>} true if available, false if unavailable (temporarily returning 0,1)
 */
async function isAvailable(doctor, clinic, date, slot, type) {
	// Get all the unavailable time slots:
	return getAppointments(doctor, clinic, date).then(appointments => {
		return schedules.get(clinic, doctor).then(schedule => {
			for (const shift of schedule[date.weekday]) {
				const timeRange = new Slot(Time.fromObject(shift.start), Time.fromObject(shift.end));

				// Check if the requested slot for the appointment is both within the time
				// limit of the shift and doesn't collide with an existing appointment:
				if (timeRange.contains(slot) && !appointmentCollides(appointments, slot)) {
					return true;
				}
			}

			return false;
		});
	});
}

async function checkModifyPermission(appointment, context) {
	return fsdb.collection("appointments").doc(appointment).get().then(appointment_data => {
		// Check if the user trying to modify the appointment is the patient:
		if (appointment_data.data().patient === context.auth.uid) {
			return true;
		}

		// Check if the user trying to modify the appointment is the doctor:
		if (appointment_data.data().doctor === context.auth.uid) return true;

		// Check if the user trying to modify the appointment is the owner of the clinic:
		return clinics.isOwner(appointment_data.data().clinic, context.auth.uid).then(owner => {
			if (owner) return true;

			// Check if the user trying to modify the appointment is a secretary of the clinic:
			return clinics.hasSecretary(appointment_data.data().clinic, context.auth.uid).then(exists => {
				if (exists) return true;

				// If the current user is neither the patient, nor the doctor, nor the owner of the clinic, nor a secretary at the clinic:
				return false;
			});
		});
	});
}

// API implementation code:

/**
 * Get all the data of the appointment.
 * @param {string} appointment The id of the appointment.
 * @returns {Promise<{
 * success: boolean,
 * message: string,
 * data: {appointment: object, doctor: object, clinic: object, extra: {date: SimpleDate, time: Time}}
 * }>} An object containing all the relevant data.
 */
async function get(appointment, context) {
	const response = {
		success: false,
		message: "",
		data: null
	}
	
	return fsdb.collection("appointments").doc(appointment).get().then(appointment_snap => {
		if (appointment_snap.exists) {
			return permissions.checkPermission(permissions.APPOINTMENT, permissions.VIEW, appointment, context).then(allowed => {
				if (allowed) {
					const promises = [];
			
					let data = {
						appointment: null,
						doctor: null,
						clinic: null,
						patient: null,
						extra: {
							date: null,
							time: null
						}
					};
			
					data.appointment = appointment_snap.data();
					data.appointment.id = appointment;
			
					promises.push(
						doctors.getData(data.appointment.doctor).then(doctor => {
							data.doctor = doctor;
						})
					);
			
					promises.push(
						clinics.get(data.appointment.clinic).then(clinic => {
							data.clinic = clinic;
						})
					);
			
					promises.push(
						users.get(data.appointment.patient).then(user => {
							data.patient = user;
						})
					);
			
					const date = new Date(data.appointment.start.toDate());
					data.extra.time = new Time(date.getUTCHours(), date.getUTCMinutes());
					data.extra.date = new SimpleDate(date).toObject();
			
					return Promise.all(promises).then(results => {
						response.success = true;
						response.data = data;
						return response;
					});
				}

				response.message = permissions.DENIED;
				return response;
			});
		}

		response.message = "The requested appointment was not found";
		return response;
	});
}

/**
 * Get all of the appointments of the specified user or doctor within the specified time range.
 * Start and end times are optional. If they are not specified then there will not be a limit on start and end times.
 * @param {{user: string, doctor: string, start: Date, end: Date}} constraints
 * @returns {Promise<object[]>} An array of appointment data.
 */
async function getAll({user, start, end, doctor}, context) {
	let promises = [];

	let query = fsdb;

	if (user) query = query.collection("users").doc(user).collection("appointments");
	else if (doctor) query = query.collection("doctors").doc(doctor).collection("appointments");

	if (start || end ) query = query.orderBy("start");
	if (start) query = query.startAt(SimpleDate.fromObject(start).toDate());
	if (end) query = query.endAt(SimpleDate.fromObject(end).toDate());

	return query.get().then(appointments => {
		for (const appointment of appointments.docs) {
			promises.push(
				get(appointment.id, context).then(response => {
					if (response.success) {
						return response.data;
					}
				})
			);
		}

		return Promise.all(promises).then(results => {
			return results;
		});
	});
}

/**
 * Get all available time slots for a specified date.
 * If appointment type is specified then it will get only time slots that are big enough to accomodate it.
 * This is one of the few functions that has to be on Cloud Functions to make sure that appointments are only made at correct times.
 * @todo use the Time, Slot, and SimpleDate classes and methods instead of ad-hoc objects and global functions.
 * @param {string} doctor The id of the doctor.
 * @param {string} clinic The id of the clinic.
 * @param {SimpleDate} date The date for which available appointments are being queried.
 * @param {string} type The type of appointment.
 * @return {Slot[]} An array of available time slots.
 */
async function getAvailable(doctor, clinic, date, type) {
	// The time from the server is in UTC with no timezone offset data.

	const simpleDate = new SimpleDate(date.year, date.month, date.day);

	/**
	 * The available time slots
	 * @type {Slot[]}
	 */
	const available = [];

	// First get all of the booked time ranges:
	return getAppointments(doctor, clinic, simpleDate).then(appointments => {
		const doctorRef = fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor);

		return doctorRef.get().then(doctor_snap => {
			return doctorRef.collection("types").get().then(type_snaps => {
				/**
				 * The minimum appointment length, in minutes
				 * @type {number}
				 */
				const minimum = doctor_snap.data().minimum;

				/**
				 * The length of the requested appointment type, in minutes.
				 * Defaults to minimum.
				 * @type {number}
				 */
				let duration = minimum;

				// Fine the matching appointment type and get the actual duration fot the selected appointment type:
				for (const type_snap of type_snaps.docs) {
					if (type_snap.data().name === type) {
						duration = doctor_snap.data().minimum * type_snap.data().duration;
						break;
					}
				}

				// Get the shift schedule for the day:
				return doctorRef.collection("shifts").get().then(shift_snaps => {
					/**
					 * The shifts for the selected day of the week.
					 * @type {Slot[]}
					 */
					const day = [];

					for (const shift_snap of shift_snaps.docs) {
						if (shift_snap.data().day === simpleDate.weekday) {
							day.push(new Slot(
								Time.fromObject(shift_snap.data().start),
								Time.fromObject(shift_snap.data().end)
							));
						}
					}

					// Find all available time slots within each shift:
					for (const shift of day) {
						// The size of each time slot should be duration. The start time of the slots should be incremented by minimum.
						// This is to get all slots for the appointment type while keeping the appointments aligned with each other.

						let current_slot = new Slot(shift.start, shift.start.incrementMinutes(duration));
			
						while (shift.contains(current_slot)) {
							// If the current time slot doesn't collide with the occupied time slots:
							if (!appointmentCollides(appointments, current_slot)) {
								available.push(current_slot);
							}
			
							// Increment both the start and end times by minimum to check the next time slot while keeping the size of the slot the same:
							current_slot = new Slot(current_slot.start.incrementMinutes(minimum),
								current_slot.end.incrementMinutes(minimum));
						}
					}
			
					return available;
				});
			});
		});
	});
}

/**
 * Make an appointment, if the time slot that is requested is available.
 * @todo use session tokens to verify that the user making the appointment
 * is the user for which the appointment is being made.
 * @todo set appointment duration based on rules set by the doctor/clinic.
 * @todo more refined return value.
 * @param {string} doctor The id of the doctor
 * @param {string} clinic The id of the clinic
 * @param {string} patient The id of the patient
 * @param {{
 * 	year: number,
 * 	month: number,
 * 	day: number
 * }} date The date of the appointment
 * @param {{
 * 	hours: number,
 * 	minutes:number
 * }} time The time of the appointment
 * @param {string} type The type of appointment
 * @returns {Promise<{id: string, messages: string[]}>} The id is the id of the new appointment. Messages contains the error messages.
 */
async function add(doctor, clinic, patient, date, time, type) {
	let response = {
		id: null,
		messages: []
	};

	if (!doctor) {
		response.messages.push("Missing doctor");
	}

	if (!clinic) {
		response.messages.push("Missing clinic");
	}

	if (!patient) {
		response.messages.push("Missing patient");
	}

	if (!date) {
		response.messages.push("Missing date");
	}
	else {
		const simpleDate = SimpleDate.fromObject(date);
		const currentDate = new SimpleDate();

		if (simpleDate.compare(currentDate) < 0) {
			response.messages.push("The date must be in the future.");
		}
		else if (simpleDate.compare(currentDate) === 0 && time) {
			/**
			 * @todo timezone bug.
			 */
			const simpleTime = Time.fromObject(time);
			const currentTime = new Time();

			if (simpleTime.compare(currentTime) < 0) {
				response.messages.push("The time must be in the future.")
			}
		}
	}

	if (!time) {
		response.messages.push("Missing time");
	}

	if (!type) {
		response.messages.push("Missing type");
	}

	if (response.messages.length == 0) {
		const start = new Date(date.year, date.month, date.day, time.hours, time.minutes);
		date = new SimpleDate(date.year, date.month, date.day);

		const start_time = new Time(start.getHours(), start.getMinutes());
		const end_time = start_time.incrementMinutes(15);
		const slot = new Slot(start_time, end_time);

		const typeData = await schedules.getType(clinic, doctor, type);

		if (await isAvailable(doctor, clinic, date, slot, type)) {
			const appointment = {
				clinic: clinic,
				doctor: doctor,
				patient: patient,
				start: start,
				duration: typeData.minutes,
				type: type
			};
			await fsdb.collection("appointments").add(appointment)
			.then(value => {
				fsdb.collection("users").doc(patient).collection("appointments").doc(value.id).set(appointment);
				fsdb.collection("doctors").doc(doctor).collection("appointments").doc(value.id).set(appointment);
				fsdb.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("appointments").doc(value.id).set(appointment);
				response.id = value.id;
			})
			.catch(reason => {
				console.error(reason);
				response.messages.push("Adding the appointment failed");
			});
		}
		else {
			response.messages.push("The appointment is unavailable");
		}
	}

	return response;
}

/**
 * Edit an appointment, if the time slot that is requested is available.
 * @todo use session tokens to verify that the user making the appointment
 * is the user for which the appointment is being made.
 * @todo set appointment duration based on rules set by the doctor/clinic.
 * @todo more refined return value.
 * @param {string} appointment The id of the appointment
 * @param {SimpleDate} date The date of the appointment
 * @param {Time} time The time of the appointment
 * @param {string} type The type of appointment
 * @param {functions.https.CallableContext} context
 * @returns {Promise<{id: string, messages: string[]}>} The id is the id of the new appointment. Messages contains the error messages.
 */
async function edit(appointment, date, time, type, context) {
	return checkModifyPermission(appointment, context).then(allowed => {
		const response = {
			success: false,
			message: "",
			id: null
		}

		if (allowed) {
			if (!appointment) {
				response.message = "Missing appointment";
				return response;
			}

			if (!date && !time && !type) {
				response.message = "no change requested";
				return response;
			}

			// Use existing data as default value. Override with new data:
			return fsdb.collection("appointments").doc(appointment).get().then(old_data => {
				const old_date = new Date(old_data.data().start.toDate());
				const old_time = new Time(old_date.getUTCHours(), old_date.getUTCMinutes());

				let new_date = new SimpleDate(old_date.getUTCFullYear(), old_date.getUTCMonth(), old_date.getUTCDate());
				let new_time = new Time(old_time.hours, old_time.minutes);
				let new_type = old_data.data().type;

				if (date) {
					new_date = new SimpleDate(date.year, date.month, date.day);
				}

				if (time) {
					new_time = new Time(time.hours, time.minutes);
				}

				if (type) {
					new_type = type;
				}

				const new_data = {
					start: new Date(new_date.year, new_date.month, new_date.day, new_time.hours, new_time.minutes),
					type: new_type
				}

				// Create the slot object for checking the availability of the new time:
				// What if the new time is the same as the old time?

				const start_time = new Time(new_time.hours, new_time.minutes);
				const end_time = start_time.incrementMinutes(old_data.data().duration);
				const slot = new Slot(start_time, end_time);

				/**
				 * @todo Instead, check if the new time is available under the assumption that the current time is not taken, since there are appointments of various lengths
				 * and so the time slots can overlap, so if an appointment is 30 minutes and you want to move it 15 minutes earlier you'll get that it's unvailable.
				 *  */
				const unchanged = (new_date.compare(new SimpleDate(old_date.getUTCFullYear(), old_date.getUTCMonth(), old_date.getUTCDate())) === 0 && new_time.compare(old_time) === 0);

				return isAvailable(old_data.data().doctor, old_data.data().clinic, new_date, slot, new_type).then(available => {
					if (unchanged) {
						response.message = "You have not made any changes";
						return response;
					}

					if (!available) {
						response.message = "The requested time is unavailable";
						return response;
					}

					const promises = [];
					promises.push(fsdb.collection("appointments").doc(appointment).update(new_data));
					promises.push(fsdb.collection("users").doc(old_data.data().patient).collection("appointments").doc(appointment).update(new_data));
					promises.push(fsdb.collection("doctors").doc(old_data.data().doctor).collection("appointments").doc(appointment).update(new_data));
					promises.push(fsdb.collection("clinics").doc(old_data.data().clinic).collection("doctors").doc(old_data.data().doctor).collection("appointments").doc(appointment).update(new_data));

					return Promise.all(promises).then(() => {
						response.success = true;
						response.id = appointment;
						return response;
					});
					// .catch(reason => {
					// 	response.message = "Updating the appointment failed";
					// 	return response;
					// });
				});
			});
		}
		else {
			response.message = permissions.DENIED;
			return response;
		}
	})
}

/**
 * Cancel an existing appointment.
 * @todo use session tokens to verify that the user canceling the appointment
 * is the user for which the appointment has been made.
 * @param {string} appointment The id of the appointment
 * @param {functions.https.CallableContext} context
 * @returns {Promise<{success: boolean, messages: string[]}>} The id is the id of the new appointment. Messages contains the error messages.
 */
async function cancel(appointment, context) {
	const response = {
		success: false,
		message: ""
	};

	return checkModifyPermission(appointment, context).then(allowed => {
		if (allowed) {
			let general_appointment = fsdb.collection("appointments").doc(appointment);
			
			return general_appointment.get().then(appointment_snap => {
				if (appointment_snap.exists) {
					const promises = [];
					
					promises.push(fsdb.collection("users").doc(appointment_snap.data().patient).collection("appointments").doc(appointment).delete());
					promises.push(fsdb.collection("doctors").doc(appointment_snap.data().doctor).collection("appointments").doc(appointment).delete());
					promises.push(fsdb.collection("clinics").doc(appointment_snap.data().clinic).collection("doctors").doc(appointment_snap.data().doctor).collection("appointments").doc(appointment).delete());
					promises.push(general_appointment.delete());
	
					return Promise.all(promises).then(() => {
						response.success = true;
						return response;
					})
				}
	
				response.message = "The appointment does not exist";
				return response;
			});
		}

		response.message = permissions.DENIED;
		return response;
	});
}
/**
 * 
 * @param {{appointment: string}} data 
 * @param {functions.https.CallableContext} context 
 * @returns 
 */
function arrived(data, context) {
	const response = {
		current: null,
		success: false,
		message: ""
	}
	return permissions.checkPermission(permissions.APPOINTMENT, permissions.MODIFY, data.appointment, context).then(allowed => {
		if (allowed) {
			// Fetch the appointment data:
			return fsdb.collection("appointments").doc(data.appointment).get().then(appointment_snapshot => {
				// If the current user is authorized, then toggle the patient's arrival status:
				let update;
				if (appointment_snapshot.data().arrived) update = {arrived: false};
				else update = {arrived: context.auth.uid};

				return fsdb.collection("appointments").doc(data.appointment).update(update)
				.then(value => {
					return fsdb.collection("users").doc(appointment_snapshot.data().patient).collection("appointments").doc(data.appointment).update(update).then(() => {
						return fsdb.collection("doctors").doc(appointment_snapshot.data().doctor).collection("appointments").doc(data.appointment).update(update).then(() => {
							return fsdb.collection("clinics").doc(appointment_snapshot.data().clinic)
												.collection("doctors").doc(appointment_snapshot.data().doctor)
												.collection("appointments").doc(data.appointment).update(update)
												.then(() => {
								response.success = true;
								response.current = update.arrived;
								return response;
							});
						});
					});
				});
			});
		}

		response.message = permissions.DENIED;
		return response;
	});
}

async function saveNote(id, text, context) {
	const response = {
		success: false,
		message: "",
		text: ""
	}

	// It should be only the doctor. todo.
	// return permissions.checkPermission(permissions.APPOINTMENT, permissions.MODIFY, id, context).then(allowed => {

	// })
	const appointmentRef = fsdb.collection("appointments").doc(id);

	return appointmentRef.get().then(appointment_snap => {
		if (context.auth.uid === appointment_snap.data().doctor) {
			const batch = fsdb.batch();
			const update = {notes: text};

			const userAppointmentRef =
				fsdb.collection("users").doc(appointment_snap.data().patient)
						.collection("appointments").doc(id);

			const doctorAppointmentRef =
				fsdb.collection("doctors").doc(appointment_snap.data().doctor)
						.collection("appointments").doc(id);

			const clinicAppointmentRef = 
				fsdb.collection("clinics").doc(appointment_snap.data().clinic)
						.collection("doctors").doc(appointment_snap.data().doctor)
						.collection("appointments").doc(id);

			batch.update(appointmentRef, update);
			batch.update(userAppointmentRef, update);
			batch.update(doctorAppointmentRef, update);
			batch.update(clinicAppointmentRef, update);

			return batch.commit().then(() => {
				response.success = true;
				response.text = text;
				return response;
			}).catch(reason => {
				response.message = reason;
				return response;
			});
		}
		
		response.message = permissions.DENIED;
		return response;
	});
}

exports.get = get;
exports.getAll = getAll;
exports.getAvailable = getAvailable;
exports.add = add;
exports.edit = edit;
exports.cancel = cancel;
exports.arrived = arrived;
exports.saveNote = saveNote;