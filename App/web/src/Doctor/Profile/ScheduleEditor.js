//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { SelectList, MainHeader, useAuth, SelectDate } from "../Common/CommonComponents";
import { Redirect, useParams } from 'react-router-dom';
import { db, fn } from '../init';

const getAvailableAppointments = fn.httpsCallable("appointments-getAvailable");
const makeAppointment = fn.httpsCallable("appointments-add");
const getDoctor = fn.httpsCallable("doctors-get");

/**
 * @todo
 * I want to have the appointment set for the doctor and the clinic together,
 * so the search page should perhaps show a separate result for every doctor+
 * clinic combination.
 * Show the information about the doctor so that the user can see that the
 * appointment is being set for the correct doctor.
 * Show widgets for selecting appoingment type, date, and time. They should
 * only show what's available. What isn't available should be greyed out.
 * The server side should make the determination in order to protect patient
 * privacy, and also the server side should handle the setting of the
 * appointment, making sure that it's valid.
 */
export function ScheduleEditor(props) {
	const auth = useAuth();
	const [redirect, setRedirect] = useState(false);
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!status) setRedirect(true);
		});

		return unsubscribe;
	}, [auth]);

	const currentDate = new Date();
	const { doctor, clinic } = useParams(); //The ID of the doctor and clinic.
	const [type, setType] = useState(null);
	// const [day, setDay] = useState(null);
	// const [month, setMonth] = useState(0);
	// const [year, setYear] = useState(2021);
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

	useEffect(() => {
		getDoctor({
			id: doctor,
			clinic: clinic
		}).then(result => {
			setDoctor(result.data);
		});
	
		db.collection("clinics").doc(clinic).get().then(result => {
			setClinic(result.data());
		});
  }, [clinic, doctor]);
	

	const types = ["new patient", "regular", "follow up"];//Temporary. Should be read from the doctor's configuration on the server.
	const tzos = (new Date()).getTimezoneOffset() / 60;

	return (
		<div className="page">
			{redirect ? <Redirect to="/general/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="content">

				<div className="appointment_picker">
					<h1>Make an Appointment</h1>
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
								onClick={(date) => {
									// setDay(date.day);
									// setMonth(date.month);
									// setYear(date.year);
									setDate(date);

									if (date.day != null && date.month != null && date.year != null) {
										getAvailableAppointments({
											doctor: doctor,
											clinic: clinic,
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
					{(success ? <Redirect to={"/create/" + success} /> : null)}
				</div>
			</div>
		</div>
	);
}