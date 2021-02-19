//Reactjs:
import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { SelectList, MainHeader, useAuth, SelectDate } from "./CommonComponents";
import { Redirect, useParams } from 'react-router-dom';
import { db, fn } from './init';

const getAvailableAppointments = fn.httpsCallable("getAvailableAppointments");
const makeAppointment = fn.httpsCallable("makeAppointment");

/**
 * Get all doctors and then filter the results by name, field of specialization, and the city where their clinic is.
 * All params are optional. If no parameters are specified (or if the value is falsy), then it will return all doctors.
 * @todo Change the format of the data that is being returned and be more picky about which data is being returned.
 * @param {string} name The name of the doctor.
 * @param {string} field The doctor's specialization.
 * @param {string} city The city in which service is being sought.
 * @returns {{doctor: object, user: object, clinics: object[], fields: string[]}[]} An array of the data of matching doctors.
 */
async function getDoctor(id) {
	// Fetch the data of all the doctor documents:
	const doctor_data = {
		doctor: null, // The doctor data.
		user: null, // The user data.
		clinics: [], // An array of the data of all the matching clinics associated with this doctor.
		fields: [], // An array of the ids of all the matching specializations of this doctor.
		};

	await db.collection("doctors").doc(id).get().then(snapshot => {
		doctor_data.doctor = snapshot.data();
		doctor_data.doctor.id = snapshot.id;
	});
	
	// Get the user data from refs:
	await doctor_data.doctor.user.get().then(user_snapshot => {
		doctor_data.user = user_snapshot.data();
		doctor_data.user.id = user_snapshot.id;
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
					let field_data = field_snapshot.data();
					field_data.id = field_snapshot.id;
					doctor.fields.push(field_data);
				}
			});
		}

		// Get the clinic data for the given doctor:
		for (i in doctor.doctor.clinics) {
			await doctor.doctor.clinics[i].get().then(clinic_snapshot => {
				// Check if the field is unspecified or is a match:
				if ((city && stringContains(clinic_snapshot.data().city, city)) || !city) {
					let city_data = clinic_snapshot.data();
					city_data.id = clinic_snapshot.id;
					doctor.clinics.push(city_data);
				}
			});
		};
	}

	// Only add to the results the doctors who have both fields and clinics that are a match:
	const results = [];
	for (const doctor of doctor_data) {
		if (doctor.clinics.length > 0 && doctor.fields.length > 0) {
			results.push(doctor);
		}
	}

	return results;
}

/*
TODO
I want to have the appointment set for the doctor and the clinic together,
so the search page should perhaps show a separate result for every doctor+
clinic combination.
Show the information about the doctor so that the user can see that the
appointment is being set for the correct doctor.
Show widgets for selecting appoingment type, date, and time. They should
only show what's available. What isn't available should be greyed out.
The server side should make the determination in order to protect patient
privacy, and also the server side should handle the setting of the
appointment, making sure that it's valid.
 */
export function MakeAppointmentPage(props) {
	const auth = useAuth();
	const { doctor, clinic } = useParams(); //The ID of the doctor and clinic.
	const [type, setType] = useState(null);
	// const [day, setDay] = useState(null);
	// const [month, setMonth] = useState(0);
	// const [year, setYear] = useState(2021);
	const [time, setTime] = useState(null);
	const [times, setTimes] = useState([]);
	const [date, setDate] = useState({
		year: 2021,
		month: 0,
		day: null
	});

	const [doctor_data, setDoctor] = useState(null);
	const [clinic_data, setClinic] = useState(null);

	db.collection("doctors").doc(doctor).get().then(snapshot => {
		setDoctor(snapshot.data().id);
	});

	const types = ["new patient", "regular", "follow up"];//Temporary. Should be read from the doctor's configuration on the server.
	const tzos = (new Date()).getTimezoneOffset() / 60;

	return (
		<div className="page">
			{!auth.user ? <Redirect to="/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="content">

				<div className="appointment_picker">
					<h1>Make an Appointment</h1>
					<h2>Appointment Details</h2>
					<h3>{doctor_data}</h3>
					<h3>{clinic_data}</h3>
					<Formik
						initialValues={{}}
						validationSchema={Yup.object({
							type: Yup.string(),
							date: Yup.date(),
							time: Yup.string(),
						})}
						onSubmit={async (values, { setSubmitting }) => {
							setSubmitting(true);

							// Set the appointment on the server:
							makeAppointment({
								doctor: doctor,
								clinic: clinic,
								patient: auth.user.uid,
								date: date,
								time: {
									hours: Number(("" + times[time]).split(":")[0]) + tzos,
									minutes: Number(("" + times[time]).split(":")[1])
								},
								type: types[type]
							})
							.then(value => {
								if (value.data.messages.length > 0) {
									for (let i = 0; i < value.data.messages.length; i++) {
										console.log(value.data.messages[i]);
									}
								}
								else {
									console.log(value.data.id);
								}
								// alert("success! " + value.data);
							})
							.catch(reason => {
								console.log(reason);
								// alert("failure! " + reason);
							});
						}}
					>
						<Form>
							{/* Put appointment-making widgets here. */}
							<SelectList
								label="Appointment Type"
								id="type"
								options={types}
								selected={type}
								onClick={(index) => setType(index)}
							/>
							<SelectDate
								id="date"
								day={date.day}
								month={date.month}
								year={date.year}
								onClick={(date) => {
									// setDay(date.day);
									// setMonth(date.month);
									// setYear(date.year);
									setDate(date);

									if (date.day != null && date.month != null && date.year != null) {
										getAvailableAppointments({
											doctor: "RLwoRslmYWvIr3kW4edP",
											clinic: "zCrg0onqcqNEmQPimqg2",
											date: date,
											type: type
										}).then(results => {
												const times = [];

												results.data.forEach(result => {
													times.push((result.start.hours - tzos) + ":" + (result.start.minutes < 10 ? "0" : "") + result.start.minutes);
												});
								
												setTimes(times);
											});
									}
								}}
							/>
							<SelectList
								label="Time Slot"
								id="time"
								options={times}
								selected={time}
								onClick={(time) => setTime(time)}
							/>
							<div className="panel">
								<button className="okay" type="submit">Submit</button>
							</div>
						</Form>
					</Formik>
				</div>
			</div>
		</div>
	);
}