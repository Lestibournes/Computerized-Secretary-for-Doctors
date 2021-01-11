//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput, Select, MainHeader, useAuth } from "./CommonComponents";
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
	const { id } = useParams(); //The ID of the doctor.

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
						</Form>
					</Formik>
				</div>
			</div>
		</div>
	);
}