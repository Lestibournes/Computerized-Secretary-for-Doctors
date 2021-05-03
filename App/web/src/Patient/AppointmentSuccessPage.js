//Reactjs:
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fn } from '../init';
import { Page } from '../Common/Components/Page';
import { Time, SimpleDate } from '../Common/classes';

const getAppointment = fn.httpsCallable("appointments-get");

export function AppointmentSuccessPage() {
	const { appointment } = useParams(); //The ID of the doctor and clinic.
	
	const [doctor_data, setDoctor] = useState(null);
	const [clinic_data, setClinic] = useState(null);
	const [appointment_data, setAppointment] = useState(null);
	const [date, setDate] = useState();
	const [time, setTime] = useState()

	useEffect(() => {
		getAppointment({id: appointment}).then(response => {
			setAppointment(response.data.appointment);
			setDate(SimpleDate.fromObject(response.data.extra.date));
			setTime(Time.fromObject(response.data.extra.time));
			setDoctor(response.data.doctor);
			setClinic(response.data.clinic);
		});
  }, [appointment]);

	let display = <h3>Loading...</h3>;

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
		<Page
			title="Make an Appointment"
			subtitle="Success!"
			content={display}
		/>
	);
}