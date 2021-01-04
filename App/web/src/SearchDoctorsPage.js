//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput, MainHeader, useAuth } from "./CommonComponents";
import { Link, Redirect } from 'react-router-dom';
import { fn, st } from './init';

fn.useEmulator("localhost", 5001);

const searchDoctors = fn.httpsCallable("searchDoctors");
const storageRef = st.ref();

export function DoctorCard(props) {
	const [profile, setProfile] = useState(null);

	storageRef.child("users/" + props.doctor.id + "/profile.png").getDownloadURL().then(url => {
		setProfile(url);
	});

	let name = props.doctor.user.firstName + " " + props.doctor.user.lastName;
	let fields = props.doctor.doctor.fields;
	let clinics = props.doctor.clinics;

	return (<div className="searchCard">
		<img src={profile} />
		<div><big>{name}</big></div>
		<div><small>{fields.map((field, index) => {return field + (index < fields.length - 1 ? " " : "")})}</small></div>
		<div><small>{clinics.map((clinic, index) => {return clinic.name + (index < clinics.length - 1 ? " " : "")})}</small></div>
	</div>)
}

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
						doctors.map((doctor, index) => {
							return <DoctorCard key={index} doctor={doctor}></DoctorCard>
						})
					}
				</div>
			</div>
		</div>
	);
}