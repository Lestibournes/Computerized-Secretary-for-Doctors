//Reactjs:
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fn } from '../init';
import { Page } from '../Common/Components/Page';
import { SimpleDate } from '../Common/classes';

const getAppointment = fn.httpsCallable("appointments-get");

export function AppointmentSuccessPage() {
	const { appointment } = useParams(); //The ID of the doctor and clinic.
	
	const [doctor_data, setDoctor] = useState(null);
	const [clinic_data, setClinic] = useState(null);
	const [appointment_data, setAppointment] = useState(null);
	const [date, setDate] = useState(new Date());

	useEffect(() => {
		getAppointment({id: appointment}).then(response => {
			setAppointment(response.data.appointment);
			setDate(SimpleDate.fromObject(response.data.extra.date));
			setDoctor(response.data.doctor);
			setClinic(response.data.clinic);
		});
  }, [appointment]);

	return (
		<Page
			title="Make an Appointment"
			subtitle="Success!"
			content={
				<p>You have a <b>{(appointment_data ? appointment_data.type : null)}</b> appointment with
					<b>
						{(doctor_data ? " Dr. " + doctor_data.user.firstName + " " + doctor_data.user.lastName: null)}
					</b>
					{" at "}
					<b>
						{(clinic_data ? clinic_data.name + ", " + clinic_data.city: null)}
					</b>
					{" on "}
					<b>
					{/* date.getFullYear() + "/" + date.getUTCMonth() + "/" + date.getUTCDate() + " " + date.getUTCHours() + ":" + date.getUTCMinutes() */}
						{(date ? date.toLocaleString() : null)}.
					</b>
				</p>
			}
		/>
	);
}