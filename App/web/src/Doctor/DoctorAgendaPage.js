//Reactjs:
import { React, useEffect, useState } from 'react';
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { Card } from '../Common/Components/Card';
import { capitalizeAll, getPictureURL } from '../Common/functions';

import * as Yup from 'yup';
import { TextInput } from '../Common/Components/TextInput';
import { Form, Formik } from 'formik';
import { Button } from '../Common/Components/Button';
import { useAuth } from '../Common/Auth';
import { Select } from '../Common/Components/Select';
import { usePopups } from '../Common/Popups';
import { Header } from '../Common/Components/Header';
import { useRoot } from '../Common/Root';
import { db } from '../init';

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
		if (auth?.user?.uid) {
			db.collection("users").doc(auth.user.uid).get().then(user_snap => {
				const user_data = user_snap.data();
				user_data.id = user_snap.id;
				if (user_data.doctor) setDoctor(user_data);
			})
		}
	}, [auth]);

	useEffect(() => {
		if (doctor && searchPrameters) {
			let query = db;

			if (searchPrameters.clinic) {
				query = query.collection("clinics").doc(searchPrameters.clinic).collection("appointments");
			}
			else {
				query = query.collectionGroup("appointments")
			}
			
			query
			.where("doctor", "==", doctor.id)
			.where("start", "==", searchPrameters.start.toDate().getTime())
			.where("end", "==", searchPrameters.end.toDate().getTime())
			.get().then(appt_snaps => {
				const appointments = [];

				for (const appt_snap of appt_snaps.docs) {
					const data = appt_snap.data();
					data.id = appt_snap.id;
					appointments.push(data);
				}

				setAppointments(appointments);
			})
			.catch(reason => popups.error(reason.message));			
		}

		// Get all of the doctor's clinics:
		if (doctor) {
			db.collectionGroup("doctors").where("doctor", "==", doctor.id).get().then(doctor_snaps => {
				for (const doctor_snap of doctor_snaps.docs) {
					const clinicRef = doctor_snap.ref.parent.parent;
					const promises = [];

					clinicRef.get().then(clinic_snap => {
						const data = clinic_snap.data();
						data.id = clinic_snap.id;
						return data;
					})

					Promise.all(promises).then(clinic_data => {
						const clinics = [];
	
						for (const clinic of clinic_data) {
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