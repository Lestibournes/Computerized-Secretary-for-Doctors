//Reactjs:
import { React, useEffect, useState } from 'react';
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { Card } from '../Common/Components/Card';
import { capitalizeAll, getPictureURL } from '../Common/functions';
import { useParams } from 'react-router-dom';

import * as Yup from 'yup';
import { TextInput } from '../Common/Components/TextInput';
import { Select } from '../Common/Components/Select';
import { Form, Formik } from 'formik';
import { Button } from '../Common/Components/Button';
import { Header } from '../Common/Components/Header';
import { useRoot } from '../Common/Root';
import { db } from '../init';
import { usePopups } from '../Common/Popups';

export function ClinicAgendaPage() {
	const root = useRoot();
	const popups = usePopups();

	const { clinic } = useParams(); //The ID of the clinic.
	const [clinicData, setClinicData] = useState();
	const [doctors, setDoctors] = useState([]);

	const [searchPrameters, setSearchParameters] = useState({
		doctor: "",
		start: new SimpleDate(),
		end: new SimpleDate().getNextDay()
	});

	const [appointments, setAppointments] = useState(null);
	const [results, setResults] = useState(null);

	const [searching, setSearching] = useState(true);

	useEffect(() => {
		if (clinic) {
			// Fetch all of the requested appointments:
			let query = db.collection("clinics").doc(clinic).collection("appointments")
			.orderBy("start")
			.where("start", ">=", searchPrameters.start.toDate())
			.where("start", "<", searchPrameters.end.toDate());

			if (searchPrameters.doctor) query.where("doctor", "==", searchPrameters.doctor);

			query.get().then(
				app_snaps => {
					const app_data = [];

					for (const app_snap of app_snaps.docs) {
						if (app_snap.exists) {
							const data = app_snap.data();
							data.id = app_snap.id;
							console.log(data.start);
							app_data.push(data);
						}
					}

					setAppointments(app_data);
				}
			)
			.catch(error => popups.error(error.message));

			// Fetch clinic data:
			db.collection("clinics").doc(clinic).get().then(
				clinic_snap => {
					const clinic_data = clinic_snap.data();
					clinic_data.id = clinic_snap.id;
					setClinicData(clinic_data);
				}
			)
			.catch(reason => popups.error(reason.message));

			// Fetch all of the clinic's doctors:
			db.collection("clinics").doc(clinic).collection("doctors").get().then(
				doctor_snaps => {
					const promises = [];

					for (const doctor_snap of doctor_snaps.docs) {
						promises.push(
							db.collection("users").doc(doctor_snap.id).get().then(
								user_snap => {
									const user_data = user_snap.data();
									user_data.id = user_snap.id;
									return user_data;
								}
							)
							.catch(reason => popups.error(reason.message))
						)
					}

					Promise.all(promises).then(users => setDoctors(users));
				}
			)
			.catch(reason => popups.error(reason.message));
		}
  }, [clinic, searchPrameters]);

	// Generate the list of appointments:
	useEffect(() => {
		if (appointments) {
			let promises = [];
			
			for (let appointment of appointments) {
				promises.push(
					getPictureURL(appointment.patient).then(url => {
						return db.collection("users").doc(appointment.patient).get().then(
							patient_snap => {
								return db.collection("users").doc(appointment.doctor).get().then(
									doctor_snap => {
										const date = new SimpleDate(appointment.start.toDate());
										const time = Time.fromDate(appointment.start.toDate());
					
										return (
											<Card
												key={appointment.id}
												link={root.get() + "/clinic/appointments/view/" + clinic + "/" + appointment.id}
												image={url}
												altText={patient_snap.data().fullName}
												title={date.toString() + " " + time.toString() + " - " + patient_snap.data().fullName}
												body={<><b>Appointment Type:</b> {capitalizeAll(appointment.type)}</>}
												footer={<><b>Doctor:</b> {doctor_snap.data().fullName}</>}
											/>
										);
									}
								)
								.catch(reason => popups.error(reason.message));
							}
						)
						.catch(reason => popups.error(reason.message));
					})
				);
			}

			Promise.all(promises).then(cards => {
				setResults(cards);
				setSearching(false);
			});
		}
	}, [appointments]);

	// Build the page display:
	let display;
	let subtitle;
	let title;

	if (clinicData) {
			display =
			<>
				<Formik
					initialValues={{
						doctor: searchPrameters.doctor,
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
							doctor: values.doctor,
							start: start,
							end: end
						});
					}}
				>
					<Form>
						<div className="searchBar">
							<Select
								label="Doctor"
								name="doctor"
								default={{
									value: "",
									label: "All"
								}}
								options={
									doctors.map(doctor => {
										return {
											value: doctor.id,
											label: doctor.fullName
										}
									})
								}
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
		title = clinicData.name;
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