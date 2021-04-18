import "./SearchDoctorsPage.css";

//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from "../Common/CommonComponents";
import { Link, Redirect } from 'react-router-dom';
import { db, fn, st } from '../init';
import { TextInput } from '../Common/Components/TextInput';
import { Card } from '../Common/Components/Card';
import { MainHeader } from '../Common/Components/MainHeader';
import { Button } from '../Common/Components/Button';
import { Select } from "../Common/Components/Select";

const searchDoctors = fn.httpsCallable("doctors-search");
const storage = st.ref();

function SelectCity() {
	const [cities, setCities] = useState([]);

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
	const [fields, setFields] = useState([]);

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
	const [redirect, setRedirect] = useState(false);
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!status) setRedirect(true);
		});

		return unsubscribe;
	}, [auth]);
	
	const [doctors, setDoctors] = useState([]);
	const [results, setResults] = useState([]);

	useEffect(() => {
		const cards = [];
		
		if (doctors) {
			let total = 0;
			
			for (let doctor of doctors) {
				total += doctor.clinics.length;
			}

			for (let doctor of doctors) {
				for (let clinic of doctor.clinics) {
					storage.child("users/" + doctor.user.id + "/profile.png").getDownloadURL().then(url => {
						doctor.image = url;
						const card = (<Card
							key={doctor.doctor.id + ", " + clinic.id}
							link={"/specific/" + doctor.doctor.id + "/user/appointments/create/" + clinic.id}
							title={doctor.user.firstName + " " + doctor.user.lastName}
							body=
								{doctor.fields.length > 0 ?
									doctor.fields.map((field, index) => field.id + (index < doctor.fields.length - 1 ? ", "
									: ""))
								: null}
							footer={clinic.name + ", " + clinic.city}
							image={doctor.image} />);
						cards.push(card);

						if (cards.length === total) {
							setResults(cards);
						}
					});
				}
			}
		}
	}, [doctors]);

	return (
		<>
			{redirect ? <Redirect to="/general/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<h1>Make an Appointment</h1>
			<h2>Find a Doctor</h2>
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
						<div className="searchbar">
							<TextInput
								label="Name"
								name="name"
								type="search"
								placeholder="Yoni Robinson"
							/>
							<SelectCity/>
							<SelectField/>
						</div>
						<div className="buttonbar">
							<Button type="submit" label="Search" />
						</div>
					</Form>
				</Formik>
			<div className="cardList">
				{
					(doctors.length === 0 ? "No doctors found" : results)
				}
			</div>
		</>
	);
}