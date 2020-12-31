//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput, MainHeader, useAuth } from "./CommonComponents";
import { Link, Redirect } from 'react-router-dom';
import { fn } from './init';

fn.useEmulator("localhost", 5001);

const searchDoctors = fn.httpsCallable("searchDoctors");

export function SearchDoctorsPage() {
	const grep = "o"

	const auth = useAuth();
	const [doctors, setDoctors] = useState([]);

	return (
		<div className="page">
			{!auth.user ? <Redirect to="/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="content">

				<div className="searchbar">
					<h1>Search Doctors</h1>
					<Formik
						initialValues={{
							email: "",
							password: ""
						}}
						validationSchema={Yup.object({
							name: Yup.string()
								.min(1)
								.required("")
						})}
						onSubmit={async (values, { setSubmitting }) => {
							setSubmitting(true);
							searchDoctors({name: values.name}).then((result) => {
								if (result.data.length == 0) {
									setDoctors(["No doctors found"]);
								}
								else {
									setDoctors(result.data);
								}
							});
						}}
					>
						<Form>
							<TextInput
								label="Name"
								name="name"
								type="text"
								placeholder="Yoni Robinson"
							/>
							<button className="okay" type="submit">Search</button>
						</Form>
					</Formik>
				</div>
				<div className="searchresults">
					{
						doctors.map((name, index) => {
							return <div key={index}>{name}</div>
						})
					}
				</div>
			</div>
		</div>
	);
}