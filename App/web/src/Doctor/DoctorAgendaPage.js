//Reactjs:
import { React, useEffect, useState } from 'react';
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { Card } from '../Common/Components/Card';
import { capitalizeAll, getPictureURL } from '../Common/functions';
import { server } from '../Common/server';

import * as Yup from 'yup';
import { TextInput } from '../Common/Components/TextInput';
import { Form, Formik } from 'formik';
import { Button } from '../Common/Components/Button';
import { useAuth } from '../Common/Auth';
import { Select } from '../Common/Components/Select';
import { usePopups } from '../Common/Popups';
import { Header } from '../Common/Components/Header';
import { useRoot } from '../Common/Root';

export function DoctorAgendaPage() {
	const root = useRoot();
	const auth = useAuth();
	const popups = usePopups();

	const [doctor, setDoctor] = useState();
	const [clinics, setClinics] = useState();

	const [searchPrameters, setSearchParameters] = useState({
		clinic: "",
		start: new SimpleDate(),
		end: new SimpleDate().getNextDay()
	});

	const [appointments, setAppointments] = useState(null);
	const [results, setResults] = useState(null);

	const [searching, setSearching] = useState(true);

	useEffect(() => {
		if (auth?.user) {
			server.doctors.getID({user: auth.user.uid}).then(response => {
				if (response.data) {
					server.doctors.getData({id: response.data}).then(results => {
						setDoctor(results.data);

						const clinics = [];

						for (const clinic of results.data.clinics) {
							if (clinic.id) clinics.push({
								value: clinic.id,
								label: clinic.name
							});
						}

						setClinics(clinics);
					});
				}
			});
		}
	}, [auth]);

	useEffect(() => {
		if (doctor) {
			server.doctors.getAppointments({
				doctor: doctor.doctor.id,
				clinic: searchPrameters.clinic ? searchPrameters.clinic : null,
				start: searchPrameters.start.toObject(),
				end: searchPrameters.end.toObject()
			}).then(response => {
				if (response.data.success) setAppointments(response.data.data);
				else popups.error(response.data.message)
			});
		}
  }, [doctor, searchPrameters]);

	useEffect(() => {
		if (appointments) {
			// appointments.sort((a, b) => {
			// 	const date_a = SimpleDate.fromObject(a.extra.date);
			// 	const date_b = SimpleDate.fromObject(b.extra.date);

			// 	const time_a = Time.fromObject(a.extra.time);
			// 	const time_b = Time.fromObject(b.extra.time);
				
			// 	if (date_a.compare(date_b) === 0) {
			// 		return time_a.compare(time_b);
			// 	}

			// 	return date_a.compare(date_b);
			// });

			// load the data and create the cards:
			let promises = [];

			for (let appointment of appointments) {
				let promise = getPictureURL(appointment.patient.id).then(url => {
					appointment.image = url;

					const date = SimpleDate.fromObject(appointment.extra.date);
					const time = Time.fromObject(appointment.extra.time);
					const clinic = appointment.clinic;

					return (
						<Card
							key={appointment.appointment.id}
							link={root.get() + "/doctor/appointments/details/" + appointment.appointment.id}
							image={appointment.image}
							altText={appointment.patient.fullName}
							title={date.toString() + " " + time.toString() + " - " + appointment.patient.fullName}
							body={capitalizeAll(appointment.appointment.type)}
							footer={clinic.name}
						/>
					);
				});
				
				promises.push(promise);
			}

			Promise.all(promises).then(cards => {
				setResults(cards);
				setSearching(false);
			});
		}
	}, [appointments]);

	let display;
	let subtitle;
	let title;

	if (doctor && clinics) {
			display =
			<>
				<Formik
					initialValues={{
						clinic: searchPrameters.clinic,
						start: searchPrameters.start.toInputString(),
						end: searchPrameters.end.toInputString()
					}}
					validationSchema={Yup.object({
						start: Yup.date(),
						end: Yup.date()
					})}
					onSubmit={async (values, { setSubmitting }) => {
						setSubmitting(true);
						setSearching(true);

						const start = new SimpleDate(values.start);
						const end = new SimpleDate(values.end);

						setSearchParameters({
							clinic: values.clinic,
							start: start,
							end: end
						});
					}}
				>
					<Form>
						<div className="searchBar">
							<Select
								label="Clinic"
								name="clinic"
								default={{label: "All", value: ""}}
								options={clinics}
							/>
							<TextInput
								label="Start"
								name="start"
								type="date"
							/>
							<TextInput
								label="End"
								name="end"
								type="date"
							/>
							<div className="buttonBar">
								<Button type="submit" label="Search" />
							</div>
						</div>
					</Form>
				</Formik>
				<div className="cardList">
					{searching ? <h3>Searching...</h3> : results.length > 0 ? results : <h3>There are no appointments in the specified time range.</h3>}
				</div>
			</>;
		title = doctor.user.fullName;
		subtitle = "Agenda";
	}

	return (
		<div className="Page">
			<Header />
			<h1>{title}</h1>
			<h2>{subtitle}</h2>
			<main>
				{display}
			</main>
		</div>
	);
}