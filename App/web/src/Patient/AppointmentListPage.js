//Reactjs:
import { React, useEffect, useState } from 'react';
import { useAuth } from "../Common/Auth";
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { Card } from '../Common/Components/Card';
import { capitalizeAll, getPictureURL } from '../Common/functions';
import { server } from '../Common/server';
import { Header } from '../Common/Components/Header';
import { Loading } from '../Common/Components/Loading';
import { useRoot } from '../Common/Root';

import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import { TextInput } from '../Common/Components/TextInput';
import { Select } from '../Common/Components/Select';
import { Button } from '../Common/Components/Button';
import { db } from '../init';
import { usePopups } from '../Common/Popups';

export function AppointmentListPage() {
	const auth = useAuth();
	const root = useRoot();
	const popups = usePopups();

	const [appointments, setAppointments] = useState(null);
	// const [clinics, setClinics] = useState([]);
	const [results, setResults] = useState(null);
	
	const [searchPrameters, setSearchParameters] = useState({
		clinic: "",
		start: new SimpleDate(),
		end: new SimpleDate().getNextYear()
	});

	const [searching, setSearching] = useState(true);

	useEffect(() => {
		if (auth?.user?.uid) {
			searchPrameters.user = auth.user.uid;

			let query = db.collectionGroup("appointments")
			.orderBy("start")
			.where("patient", "==", searchPrameters.user);

			if (searchPrameters.clinic) query = query.where("clinic", "==", searchPrameters.clinic);
			if (searchPrameters.doctor) query = query.where("doctor", "==", searchPrameters.doctor);
			if (searchPrameters.start) query = query.where("start", ">=", searchPrameters.start.toDate());
			if (searchPrameters.end) query = query.where("start", "<=", searchPrameters.end.toDate());

			query.get().then(
				app_snaps => {
					const app_data = [];

					for (const app_snap of app_snaps.docs) {
						const data = app_snap.data();
						data.id = app_snap.id;
						app_data.push(data);
					}

					setAppointments(app_data);
				}
			)
			.catch(reason => popups.error(reason.message));
		}
  }, [auth, searchPrameters]);

	useEffect(() => {
		if (appointments) {
			// load the data and create the cards:
			let promises = [];

			for (let appointment of appointments) {
				promises.push(
					getPictureURL(appointment.doctor).then(async url => {
						const doctor = await db.collection("users").doc(appointment.doctor).get().then(
							doctor_snap => {
								const doctor_data = doctor_snap.data();
								doctor_data.id = doctor_snap.id;
								return doctor_data;
							}
						);

						const specializations = await db.collection("users").doc(appointment.doctor).collection("specializations").get().then(
							spec_snaps => {
								const spec_data = [];

								for (const spec_snap of spec_snaps.docs) {
									const data = spec_snap.data();
									data.id = spec_snap.id;
									spec_data.push(data);
								}

								return spec_data;
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
		
						/**
						 * @todo sort by date and time.
						 */
						const data ={
							data: appointment,
							card: 
								<Card
									key={appointment.id}
									link={root.get() + "/user/appointments/details/" + appointment.clinic + "/" + appointment.id}
									image={url}
									altText={(doctor ? doctor.fullName : "")}
									title={date.toString() + " " + time.toString() + " - " + (doctor ? doctor.fullName : "")}
									body={specializations ? specializations.map((specialization, index) => {return capitalizeAll(specialization.name) + (index < specializations.length - 1 ? ", " : "")}) : ""}
									footer={clinic ? clinic.name + ", " + clinic.city : ""}
								/>
						}
						return data;
					})
				);
			}

			Promise.all(promises).then(cards => {
				cards.sort(
					(a, b) => {
						return a.data.start > b.data.start ? 1 : a.data.start < b.data.start ? -1 : 0;
					}
				);

				setResults(cards.map(card => {return card.card}));
				setSearching(false);
			});
		}
	}, [appointments]);

	let display =
		<>
			<Formik
				initialValues={{
					// clinic: searchPrameters.clinic,
					// doctor: searchPrameters.doctor,
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
						// clinic: values.clinic,
						// doctor: values.doctor,
						start: start,
						end: end
					});
				}}
			>
				<Form>
					<div className="searchBar">
						{/* <Select
							label="Clinic"
							name="clinic"
							default={{label: "All", value: ""}}
							options={clinics}
						/> */}
						{/* <Select
							label="Doctor"
							name="doctor"
							default={{label: "All", value: ""}}
							options={doctors}
						/> */}
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
				{searching ? <h3>Searching...</h3> : results?.length > 0 ? results : <h3>There are no appointments in the specified time range.</h3>}
			</div>
		</>;

	// if (results) {
	// 	if (results.length) display = <div className="cardList">{results}</div>;
	// 	else display = <h3>You don't have any upcoming appointments.</h3>
	// }
	
	return (
		<div className="Page">
			<Header />
			<h1>My Appointments</h1>
			<main>
				{display}
			</main>
		</div>
	);
}