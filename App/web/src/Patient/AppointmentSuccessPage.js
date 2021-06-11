//Reactjs:
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { server } from '../Common/server';
import { usePopups } from '../Common/Popups';
import { Header } from '../Common/Components/Header';
import { Loading } from '../Common/Components/Loading';

export function AppointmentSuccessPage() {
	const { appointment } = useParams(); //The ID of the doctor and clinic.
	
	const [doctor_data, setDoctor] = useState(null);
	const [clinic_data, setClinic] = useState(null);
	const [appointment_data, setAppointment] = useState(null);
	const [date, setDate] = useState();
	const [time, setTime] = useState()

	const popupManager = usePopups();

	useEffect(() => {
		server.appointments.get({id: appointment}).then(response => {
			if (response.data.success) {
				const data = response.data.data;
				setAppointment(data.appointment);
				setDate(SimpleDate.fromObject(data.extra.date));
				setTime(Time.fromObject(data.extra.time));
				setDoctor(data.doctor);
				setClinic(data.clinic);
			}
			else {
				popupManager.error(response.data.message)
			}
		});
  }, [appointment]);

	let display = <Loading />;

	if (appointment_data && doctor_data && clinic_data && date) {
		display =
		<p>You have a <b>{appointment_data.type}</b> appointment with
			<b>
				{" Dr. " + doctor_data.user.firstName + " " + doctor_data.user.lastName}
			</b>
			{" at "}
			<b>
				{clinic_data.name + ", " + clinic_data.city}
			</b>
			{" on "}
			<b>
				{date.toString()}
			</b>
			{" at "}
			<b>
				{time.toString()}
			</b>
		</p>
	}

	return (
		<div className="Page">
			<Header />
			<h1>Make an Appointment</h1>
			<h2>Success!</h2>
			<main>
				{display}
			</main>
		</div>
	);
}