//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput, Select, MainHeader, useAuth } from "./CommonComponents";
import { Redirect } from 'react-router-dom';
import { db, fn, st } from './init';

// fn.useEmulator("localhost", 5001);

const searchDoctors = fn.httpsCallable("searchDoctors");
const storageRef = st.ref();

function DoctorCard(props) {
	const [profile, setProfile] = useState(null);

	storageRef.child("users/" + props.doctor.id + "/profile.png").getDownloadURL().then(url => {
		setProfile(url);
	});

	let name = props.doctor.user.firstName + " " + props.doctor.user.lastName;
	let fields = props.doctor.fields;
	let clinics = props.doctor.clinics;

	return (<div className="searchCard">
		<img src={profile} />
		<div className="name"><big>{name}</big></div>
		<div className="fields"><small>{fields.map((field, index) => {return field + (index < fields.length - 1 ? " " : "")})}</small></div>
		<div className="location"><small>{clinics.map((clinic, index) => {return clinic.name + (index < clinics.length - 1 ? " " : "")})}</small></div>
	</div>)
}

function SelectCity() {
	const [cities, setCities] = useState(["Jaffa", "Hebron"]);

	useEffect(() => {
		let mounted = true;
		db.collection("cities").get().then(snap => {
			if (mounted) {
				let results = [];
		
				snap.forEach(a => {
					results.push({
						id: a.id,
						label: String(a.id).split(" ").map(word => {
							return String(word)[0].toLocaleUpperCase() + String(word).slice(1) + " ";
						})
					});
				});
				
				setCities(results);
			}
		});

		return () => {mounted = false};
	}, []);
	
	return (
		<Select label="City" name="city" options={cities}/>
	);
}

function SelectField() {
	const [fields, setFields] = useState(["Neurology", "Cardiology"]);

	useEffect(() => {
		let mounted = true;
		db.collection("fields").get().then(snapshots => {
			if (mounted) {
				let results = [];
		
				snapshots.forEach(snapshot => {
					results.push({
						id: snapshot.id,
						label: String(snapshot.id).split(" ").map(word => {
							return String(word)[0].toLocaleUpperCase() + String(word).slice(1) + " ";
						})
					});
				});
				
				setFields(results);
			}
		});

		return () => {mounted = false};
	}, []);
	
	return (
		<Select label="Specialization" name="field" options={fields}/>
	);
}

export function SearchDoctorsPage() {
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
						initialValues={{}}
						validationSchema={Yup.object({
							name: Yup.string(),
							city: Yup.string(),
							field: Yup.string(),
						})}
						onSubmit={async (values, { setSubmitting }) => {
							setSubmitting(true);
							searchDoctors({name: values.name, city: values.city, field: values.field}).then((result) => {
								setDoctors(result.data);
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
							<SelectCity/>
							<SelectField/>
							<button className="okay" type="submit">Search</button>
						</Form>
					</Formik>
				</div>
				<div className="searchresults">
					{
						(doctors.length === 0 ? "No doctors found" : "")
					}
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