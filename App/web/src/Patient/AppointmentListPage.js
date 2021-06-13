//Reactjs:
import { React, useEffect, useState } from 'react';
import { useAuth } from "../Common/Auth";
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { Card } from '../Common/Components/Card';
import { getPictureURL } from '../Common/functions';
import { server } from '../Common/server';
import { Header } from '../Common/Components/Header';
import { Loading } from '../Common/Components/Loading';
import { useRoot } from '../Common/Root';

import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import { TextInput } from '../Common/Components/TextInput';
import { Select } from '../Common/Components/Select';
import { Button } from '../Common/Components/Button';

export function AppointmentListPage() {
	const auth = useAuth();
	const root = useRoot();

	const [appointments, setAppointments] = useState(null);
	const [clinics, setClinics] = useState([]);
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
			
			server.appointments.getAll({
				user: auth.user.uid,
				clinic: searchPrameters.clinic ? searchPrameters.clinic : null,
				start: searchPrameters.start ? searchPrameters.start.toObject() : null,
				end: searchPrameters.end ? searchPrameters.end.toObject() : null}).then(response => {
				if (response.data) setAppointments(response.data);
			});
		}
  }, [auth, searchPrameters]);

	useEffect(() => {
		if (appointments) {
			appointments.sort((a, b) => {
				const date_a = SimpleDate.fromObject(a.extra.date);
				const date_b = SimpleDate.fromObject(b.extra.date);

				const time_a = Time.fromObject(a.extra.time);
				const time_b = Time.fromObject(b.extra.time);
				
				if (date_a.compare(date_b) === 0) {
					return time_a.compare(time_b);
				}

				return date_a.compare(date_b);
			});

			// load the data and create the cards:
			let promises = [];

			for (let appointment of appointments) {
				let promise = getPictureURL(appointment.doctor.user.id).then(url => {
					appointment.image = url;

					const date = SimpleDate.fromObject(appointment.extra.date);
					const time = Time.fromObject(appointment.extra.time);
					const doctor = appointment.doctor;
					const clinic = appointment.clinic;
	
					/**
					 * @todo sort by date and time.
					 */
					return (
						<Card
							key={appointment.appointment.id}
							link={root.get() + "/user/appointments/details/" + appointment.appointment.id}
							image={appointment.image}
							altText={(doctor ? doctor.user.firstName + " " + doctor.user.lastName : null)}
							title={date.toString() + " " + time.toString() + " - " + (doctor ? doctor.user.firstName + " " + doctor.user.lastName : null)}
							body={doctor ? doctor.fields.map((field, index) => {return field.id + (index < doctor.fields.length - 1 ? " " : "")}) : null}
							footer={clinic ? clinic.name + ", " + clinic.city : null}
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

	let display =
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
						{/* <Select
							label="Clinic"
							name="clinic"
							default={{label: "All", value: ""}}
							options={clinics}
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