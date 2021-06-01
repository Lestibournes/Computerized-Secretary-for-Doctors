//Reactjs:
import { React, useEffect, useState } from 'react';
import { Time } from "../Common/classes";
import { Card } from '../Common/Components/Card';
import { SimpleDate } from "../Common/classes";
import { Page } from '../Common/Components/Page';
import { capitalizeAll, getPictureURL } from '../Common/functions';
import { useParams } from 'react-router-dom';
import { server } from '../Common/server';

import * as Yup from 'yup';
import { TextInput } from '../Common/Components/TextInput';
import { Select } from '../Common/Components/Select';
import { Form, Formik } from 'formik';
import { Button } from '../Common/Components/Button';

export function ClinicAgendaPage() {
	const { clinic } = useParams(); //The ID of the doctor.
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
			server.clinics.getAppointments({
				clinic: clinic,
				doctor: searchPrameters.doctor ? searchPrameters.doctor : null,
				start: searchPrameters.start.toObject(),
				end: searchPrameters.end.toObject()
			}).then(response => {
				setAppointments(response.data.data);
			});

			server.clinics.get({id: clinic}).then(results => {
				setClinicData(results.data);
			});

			server.clinics.getAllDoctors({clinic: clinic}).then(response => {
				setDoctors(response.data);
			});
		}
  }, [clinic, searchPrameters]);

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
					const doctor = appointment.doctor;
					const clinic = appointment.clinic;

					return (
						<Card
							key={appointment.appointment.id}
							link={"/specific/secretary/appointments/view/" + appointment.appointment.id}
							image={appointment.image}
							altText={appointment.patient.fullName}
							title={date.toString() + " " + time.toString() + " - " + appointment.patient.fullName}
							body={capitalizeAll(appointment.appointment.type)}
							footer={doctor.user.fullName}
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
											id: doctor.doctor.id,
											label: doctor.user.fullName
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
		<Page title={title} subtitle={subtitle}>
			{display}
		</Page>
	);
}