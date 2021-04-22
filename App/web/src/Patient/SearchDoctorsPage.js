import "./SearchDoctorsPage.css";

//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { fn } from '../init';
import { TextInput } from '../Common/Components/TextInput';
import { Card } from '../Common/Components/Card';
import { Button } from '../Common/Components/Button';
import { Select } from "../Common/Components/Select";
import { Page } from "../Common/Components/Page";
import { getPictureURL } from "../Common/functions";

const searchDoctors = fn.httpsCallable("doctors-search");
const getAllCities = fn.httpsCallable("clinics-getAllCities");
const getAllSpecializations = fn.httpsCallable("doctors-getAllSpecializations");

export function SearchDoctorsPage() {
	const [cities, setCities] = useState([]);
	const [fields, setFields] = useState([]);

	/**
	 * There are the following states:
	 * No search has been conducted: show nothing.
	 * A search has been conducted, waiting for the results: show a loading message.
	 * The results have arrived, and they are empty: show nothing found message.
	 * The results have arrived, and the are not empty: show the results.
	 * 
	 * Therefor I need to track whether a search is currently underway, whether a search has already completed,
	 * and what the current results are.
	 */

	const [searching, setSearching] = useState(false);
	const [searched, setSearched] = useState(false);
	
	const [doctors, setDoctors] = useState([]);
	const [results, setResults] = useState([]);

	useEffect(() => {
		getAllCities().then(response => {
			setCities(response.data);
		});

		getAllSpecializations().then(response => {
			setFields(response.data);
		});
	}, []);

	useEffect(() => {
		const cards = [];
		const build = async (doctor, clinic, cards, total) => {
			await getPictureURL(doctor.user.id).then(url => {
				doctor.image = url;
			});

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
				setSearching(false);
				setSearched(true);
			}
		}

		if (doctors.length === 0) {
			setResults([]);
			setSearching(false);
		}
		
		else {
			let total = 0;
			
			for (let doctor of doctors) {
				total += doctor.clinics.length;
			}

			for (let doctor of doctors) {
				for (let clinic of doctor.clinics) {
					build(doctor, clinic, cards, total);
				}
			}
		}
	}, [doctors]);

	let display = <h2>Loading...</h2>;
	let searchResults;

	if (searching) {
		searchResults = <h2>Searching...</h2>;
	}
	else if (searched) {
		if (results.length === 0) {
			searchResults = <h2>No doctors found</h2>;
		}
		else {
			searchResults =
				<div className="cardList">
					{results}
				</div>;
		}
	}

	if (cities.length > 0 && fields.length > 0) {
		display = 
		<>
			<Formik
				initialValues={{}}
				validationSchema={Yup.object({
					name: Yup.string(),
					city: Yup.string(),
					field: Yup.string(),
				})}
				onSubmit={async (values, { setSubmitting }) => {
					setSubmitting(true);
					setSearching(true);

					searchDoctors({name: values.name, city: values.city, field: values.field}).then((result) => {
						setDoctors(result.data);
					});
				}}
			>
				<Form>
					<div className="widgets">
						<TextInput
							label="Name"
							name="name"
							type="search"
							placeholder="Yoni Robinson"
						/>
						<Select label="City" name="city" options={cities}/>
						<Select label="Specialization" name="field" options={fields}/>
					</div>
					<div className="buttonBar">
						<Button type="submit" label="Search" />
					</div>
				</Form>
			</Formik>
			{searchResults}
		</>;
	}

	return (
		<Page
			title="Make an Appointment"
			subtitle="Find a Doctor"
			content={display}
		/>
	);
}