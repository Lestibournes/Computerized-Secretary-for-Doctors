//Reactjs:
import { React, useEffect, useState } from 'react';
import { fn } from '../init';
import { Time } from "../Common/classes";
import { Card } from '../Common/Components/Card';
import { SimpleDate } from "../Common/classes";
import { Page } from '../Common/Components/Page';
import { capitalizeAll, getPictureURL } from '../Common/functions';
import { useParams } from 'react-router-dom';
import { Button } from '../Common/Components/Button';
import { Popup } from '../Common/Components/Popup';

const functions = {
	doctors: {
		getAppointments: fn.httpsCallable("doctors-getAppointments"),
		getData: fn.httpsCallable("doctors-getData"),
	},
	clinics: {
		get: fn.httpsCallable("clinics-get"),
	},
	appointments: {
		get: fn.httpsCallable("appointments-get"),
		arrived: fn.httpsCallable("appointments-arrived"),
	}
}

export function SecretaryAppointmentPage() {
	/**
	 * @type {{appointment: string}}
	 */
	const {appointment} = useParams();

	const [appointmentData, setAppointmentData] = useState();
	const [doctorData, setDoctorData] = useState();
	const [clinicData, setClinicData] = useState();

	const [image, setImage] = useState(null); // The url of the patient's profile picture.
	const [arrived, setArrived] = useState(false); // The patient's arrival status.

	const [message, setMessage] = useState(); // A message to be displayed in a popup.
	
	useEffect(() => {
		if (appointment) {
			functions.appointments.get({id: appointment}).then(results => {
				setAppointmentData(results.data);

				functions.doctors.getData({id: results.data.appointment.doctor}).then(results => {
					setDoctorData(results.data);
				});
				
				functions.clinics.get({id: results.data.appointment.clinic}).then(results => {
					setClinicData(results.data);
				});

				getPictureURL(results.data.appointment.patient).then(url => {
					setImage(url);
				});

				setArrived(results.data.appointment.arrived);
			});
		}
	}, [appointment]);

	const popups =
	<>
		{message ? 
			<Popup title={message.title} close={() => setMessage(null)}>
				{message.body}
			</Popup>
		: ""}
	</>;

	let display;
	let subtitle;
	let title;

	if (appointmentData && doctorData && clinicData) {
		title = clinicData.name;
		subtitle = "Dr. " + doctorData.user.fullName + "'s Appointment";
		display = 
		<>
			<div className="headerbar">
				<h3>Patient Details</h3>
				<Button
					type={arrived ? "okay" : ""}
					label="Arrived"
					action={() => {
						functions.appointments.arrived({appointment: appointment}).then(response => {
							if (response.data.success) {
								setArrived(response.data.current);
							}
							else {
								// Display error message popup.
								setMessage({
									title: "Error",
									message: response.data.message
								});
							}
						});
					}}
				/>
			</div>
			<div className="table">
				<b>Photo</b> <img src={image} alt={appointmentData.patient.fullName} />
				<b>Name:</b> <span>{appointmentData.patient.fullName}</span>
				<b>Sex:</b> <span>{appointmentData.patient.sex ? capitalizeAll(appointmentData.patient.sex) : "Not specified"}</span>
			</div>
			<div className="headerbar">
				<h3>Appointment Details</h3>
			</div>
			<div className="table">
				<b>Start:</b> <span>{
				SimpleDate.fromObject(appointmentData.extra.date).toString() + " " + 
				Time.fromObject(appointmentData.extra.time).toString()
				}</span>
				<b>Duration:</b> <span>{appointmentData.appointment.duration} minutes</span>
				<b>Type:</b> <span>{capitalizeAll(appointmentData.appointment.type)}</span>
			</div>
		</>;
	}
	
	return (
		<Page title={title} subtitle={subtitle} popups={popups}>
			{display}
		</Page>
	);
}