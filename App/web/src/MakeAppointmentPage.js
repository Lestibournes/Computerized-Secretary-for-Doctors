//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput, SelectList, Select, MainHeader, useAuth, SelectDate } from "./CommonComponents";
import { Redirect, useParams } from 'react-router-dom';
import { db, fn, st } from './init';
import { string } from 'yup/lib/locale';

const getAvailableAppointments = fn.httpsCallable("getAvailableAppointments");
const makeAppointment = fn.httpsCallable("makeAppointment");
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

	const types = ["new patient", "regular", "follow up"];//Temporary. Should be read from the doctor's configuration on the server.
	const tzos = (new Date()).getTimezoneOffset() / 60;

	return (
		<div className="page">
			{!auth.user ? <Redirect to="/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="content">

				<div className="searchbar">
					<h1>Set Appointment</h1>
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
								date: date,
								time: {
									hours: ("" + times[time]).split(":")[0],
									minutes: ("" + times[time]).split(":")[1]
								},
								type: values.type}).then(() => {
								alert("success!");
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
							<button className="okay" type="submit">Submit</button>
						</Form>
					</Formik>
							<h3>
							{doctor}
							</h3>
							<h3>
							{clinic}
							</h3>
				</div>
			</div>
		</div>
	);
}