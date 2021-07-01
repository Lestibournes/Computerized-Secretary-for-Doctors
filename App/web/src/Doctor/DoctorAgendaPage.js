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
import { Loading } from "../Common/Components/Loading";
import { Strings } from '../Common/Classes/strings';

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
	const [appointmentCards, setAppointmentCards] = useState(null);

	const [searching, setSearching] = useState(true);

	// Get the doctor's data:
	useEffect(() => {
		if (auth?.user?.uid) {
			db.collection("users").doc(auth.user.uid).get().then(user_snap => {
				const user_data = user_snap.data();
				user_data.id = user_snap.id;
				if (user_data.doctor) setDoctor(user_data);
			})
		}
	}, [auth]);

	// Get the appointments data:
	useEffect(() => {
		if (doctor && searchPrameters) {
			setSearching(true);

			let query = db;

			if (searchPrameters.clinic) {
				query = query.collection("clinics").doc(searchPrameters.clinic).collection("appointments");
			}
			else {
				query = query.collectionGroup("appointments")
			}
			
			query
			.where("doctor", "==", doctor.id)
			.where("start", ">=", searchPrameters.start.toDate())
			.where("start", "<=", searchPrameters.end.toDate())
			.get().then(app_snaps => {
				const appointments = [];

				for (const app_snap of app_snaps.docs) {
					const data = app_snap.data();
					data.id = app_snap.id;
					appointments.push(data);
				}

				setAppointments(appointments);
			})
			.catch(reason => popups.error(reason.message));			
		}

		// Get all of the doctor's clinics:
		if (doctor) {
			db.collectionGroup("doctors").where("user", "==", doctor.id).get().then(doctor_snaps => {
				for (const doctor_snap of doctor_snaps.docs) {
					const clinicRef = doctor_snap.ref.parent.parent;
					const promises = [];

					promises.push(
						clinicRef.get().then(clinic_snap => {
							if (clinic_snap.exists) {
								const data = clinic_snap.data();
								data.id = clinic_snap.id;
								return data;
							}

							return null;
						})
					);

					Promise.all(promises).then(clinic_data => {
						const clinics = [];
						
						for (const clinic of clinic_data) {
							if (clinic?.id) clinics.push({
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
			// load the data and create the cards:
			let promises = [];

			for (let appointment of appointments) {
				let promise = getPictureURL(appointment.patient).then(
					async url => {
						const patient = await db.collection("users").doc(appointment.patient).get().then(
							patient_snap => {
								const patient_data = patient_snap.data();
								patient_data.id = patient_snap.id;
								return patient_data;
							}
						);

						const doctor = await db.collection("users").doc(appointment.doctor).get().then(
							doctor_snap => {
								const doctor_data = doctor_snap.data();
								doctor_data.id = doctor_snap.id;
								return doctor_data;
							}
						);

						const clinic = await db.collection("clinics").doc(appointment.clinic).get().then(
							clinic_snap => {
								const clinic_data = clinic_snap.data();
								clinic_data.id = clinic_snap.id;
								return clinic_data;
							}
						);

						const date = new SimpleDate(appointment.start.toDate());
						const time = Time.fromDate(appointment.start.toDate());

						return (
							<Card
								key={appointment.id}
								link={root.get() + "/doctor/appointments/details/" + appointment.clinic + "/" + appointment.id}
								image={url}
								altText={patient.fullName}
								title={date.toString() + " " + time.toString() + " - " + patient.fullName}
								body={<span><b>{Strings.instance.get(81)}:</b> {capitalizeAll(appointment.type)}</span>}
								footer={<span><b>{Strings.instance.get(92)}:</b> {clinic.name}</span>}
							/>
						);
					}
				);
				
				promises.push(promise);
			}

			Promise.all(promises).then(cards => {
				setAppointmentCards(cards);
				setSearching(false);
			});
		}
	}, [appointments]);

	let display = <Loading />;

	if (doctor && clinics) {
			display =
			<>
				<h1>{doctor.fullName}</h1>
				<h2>{Strings.instance.get(37)}</h2>
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
								label={Strings.instance.get(92)}
								name="clinic"
								default={{label: Strings.instance.get(219), value: ""}}
								options={clinics}
							/>
							<TextInput
								label={Strings.instance.get(58)}
								name="start"
								type="date"
							/>
							<TextInput
								label={Strings.instance.get(70)}
								name="end"
								type="date"
							/>
							<div className="buttonBar">
								<Button type="submit" label={Strings.instance.get(71)} />
							</div>
						</div>
					</Form>
				</Formik>
				<div className="cardList">
					{searching ? <h3>{Strings.instance.get(72)}</h3> : appointmentCards.length > 0 ? appointmentCards : <h3>{Strings.instance.get(73)}</h3>}
				</div>
			</>;
	}

	return (
		<div className="Page">
			<Header />
			{display}
		</div>
	);
}