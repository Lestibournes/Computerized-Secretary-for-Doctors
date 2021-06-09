import "./SearchDoctorsPage.css";

//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput } from '../Common/Components/TextInput';
import { Card } from '../Common/Components/Card';
import { Button } from '../Common/Components/Button';
import { Select } from "../Common/Components/Select";
import { getPictureURL } from "../Common/functions";
import { server } from "../Common/server";
import { Header } from "../Common/Components/Header";
import { Loading } from "../Common/Components/Loading";

export function SearchDoctorsPage() {
	const [cities, setCities] = useState();
	const [fields, setFields] = useState();

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
	
	const [doctors, setDoctors] = useState();
	const [results, setResults] = useState();

	useEffect(() => {
		server.clinics.getAllCities().then(response => {
			setCities(response.data.map(city => {
				return {
					value: city.id,
					label: city.label
				}
			}));
		});

		server.specializations.getAll().then(response => {
			setFields(response.data.map(specialization => {
				return {
					value: specialization.id,
					label: specialization.label
				}
			}));
		});
	}, []);

	useEffect(() => {
		if (doctors) {
			if (doctors.length === 0) {
				setResults([]);
				setSearching(false);
				setSearched(true);
			}
			else {
				const promises = [];
	
				for (let doctor of doctors) {
					for (let clinic of doctor.clinics) {
						promises.push(
							getPictureURL(doctor.user.id).then(url => {
								doctor.image = url;
	
								return (
								<Card
									key={doctor.doctor.id + ", " + clinic.id}
									link={"/specific/" + doctor.doctor.id + "/user/appointments/create/" + clinic.id}
									title={doctor.user.firstName + " " + doctor.user.lastName}
									body=
										{doctor.fields.length > 0 ?
											doctor.fields.map((field, index) => field.id + (index < doctor.fields.length - 1 ? ", "
											: ""))
										: null}
									footer={clinic.name + ", " + clinic.city}
									image={doctor.image}
								/>);
							})
						);
					}
				}
	
				Promise.all(promises).then(cards => {
					setResults(cards);
					setSearching(false);
					setSearched(true);
				});
			}
		}
	}, [doctors]);

	let display = <Loading />;
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

	if (cities && fields) {
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

					const data = {}

					if (values.name) data.name = values.name;
					if (values.city) data.city = values.city;
					if (values.field) data.field = values.field;

					server.doctors.search(data).then((result) => {
						setDoctors(result.data);
					});
				}}
			>
				<Form>
					<div className="searchBar">
						<TextInput
							label="Name"
							name="name"
							type="search"
							placeholder="Yoni Robinson"
						/>
						<Select label="City" name="city" options={cities}/>
						<Select label="Specialization" name="field" options={fields}/>
						<div className="buttonBar">
							<Button type="submit" label="Search" />
						</div>
					</div>
				</Form>
			</Formik>
			{searchResults}
		</>;
	}

	return (
		<div className="Page">
			<Header />
			<h1>Make an Appointment</h1>
			<h2>Find a Doctor</h2>
			<main>
				{display}
			</main>
		</div>
	);
}