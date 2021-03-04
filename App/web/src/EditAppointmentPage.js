//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { SelectList, MainHeader, useAuth, SelectDate } from "./CommonComponents";
import { Redirect, useParams } from 'react-router-dom';
import { db, fn } from './init';
import { SimpleDate, Time } from './classes';

const getAvailableAppointments = fn.httpsCallable("getAvailableAppointments");
const makeAppointment = fn.httpsCallable("makeAppointment");
const getDoctor = fn.httpsCallable("getDoctor");

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
export function EditAppointmentPage(props) {
	const selectDate = (date) => {
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
	}

	const currentDate = new Date();
	const auth = useAuth();
	const { appointment } = useParams(); //The ID of the appointment.
	
	const [data, setData] = useState(null); //The data of the appointment.

	const [type, setType] = useState(null);
	const [time, setTime] = useState(null);
	const [times, setTimes] = useState([]);
	const [date, setDate] = useState({
		year: currentDate.getUTCFullYear(),
		month: currentDate.getUTCMonth(),
		day: null
	});

	const [success, setSuccess] = useState(null);

	const [doctor_data, setDoctor] = useState(null);
	const [clinic_data, setClinic] = useState(null);

	const types = ["new patient", "regular", "follow up"];//Temporary. Should be read from the doctor's configuration on the server.
	const tzos = (new Date()).getTimezoneOffset() / 60;

	useEffect(() => {
		if (auth.user) {
			db.collection("users").doc(auth.user.uid).collection("appointments").doc(appointment).get().then(appointment => {
				console.log(appointment.data());

				setData(appointment.data());

				types.forEach((type, index) => {
					if (type.toLowerCase() === appointment.data().type.toLowerCase()) {
						setType(index);
					}
				});
				
				const date = new Date(appointment.data().start.toDate());
				
				selectDate({
					year: date.getUTCFullYear(),
					month: date.getUTCMonth(),
					day: date.getUTCDate()
				});

				getDoctor({
					id: appointment.data().doctor,
					clinic: appointment.data().clinic
				}).then(result => {
					setDoctor(result.data);
				});
			
				db.collection("clinics").doc(appointment.data().clinic).get().then(result => {
					setClinic(result.data());
				});
			});
		}
  }, [auth.user, appointment]);

	return (
		<div className="page">
			{!auth.user ? <Redirect to="/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="content">

				<div className="appointment_picker">
					<h1>Change Your Appointment</h1>
					<h2>Appointment Details{(doctor_data ? " for Dr. " + doctor_data.user.firstName + " " + doctor_data.user.lastName : null)}{(clinic_data ? " at " + clinic_data.name + ", " + clinic_data.city : null)}</h2>
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
								doctor: data.doctor,
								clinic: data.clinic,
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
								
								setSuccess(value.data.id);
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
								onClick={selectDate}
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
					{(success ? <Redirect to={"/create/" + success} /> : null)}
				</div>
			</div>
		</div>
	);
}