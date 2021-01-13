//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput, SelectList, Select, MainHeader, useAuth, SelectDate } from "./CommonComponents";
import { Redirect, useParams } from 'react-router-dom';
import { db, fn, st } from './init';

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
	const [day, setDay] = useState(1);
	const [month, setMonth] = useState(0);
	const [year, setYear] = useState(2021);

	const types = ["new patient", "regular", "follow up"];

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
							// Set the appointment on the server.
						}}
					>
						<Form>
							{/* Put appointment-making widgets here. */}
							<SelectList
								label="Type"
								id="type"
								options={types}
								selected={type}
								onClick={(index) => setType(index)}
							/>
							<SelectDate
								id="date"
								day={day}
								month={month}
								year={year}
								onClick={(date) => {
									setDay(date.day);
									setMonth(date.month);
									setYear(date.year);
								}}
							/>
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