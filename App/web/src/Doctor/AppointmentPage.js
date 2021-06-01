//Reactjs:
import { React, useEffect, useState } from 'react';
import { Time } from "../Common/classes";
import { SimpleDate } from "../Common/classes";
import { Page } from '../Common/Components/Page';
import { capitalizeAll, error, getPictureURL } from '../Common/functions';
import { useParams } from 'react-router-dom';
import { Button } from '../Common/Components/Button';
import { Popup } from '../Common/Components/Popup';
import { server } from '../Common/server';

export function AppointmentPage() {
	/**
	 * @type {{appointment: string}}
	 */
	const {appointment} = useParams();

	const [appointmentData, setAppointmentData] = useState();
	const [doctorData, setDoctorData] = useState();
	const [clinicData, setClinicData] = useState();

	const [image, setImage] = useState(null); // The url of the patient's profile picture.
	const [arrived, setArrived] = useState(false); // The patient's arrival status.

	const [popupManager, setPopupManager] = useState({});
	
	useEffect(() => {
		if (appointment) {
			server.appointments.get({id: appointment}).then(results => {
				if (results.data.success) {
					const data = results.data.data;

					setAppointmentData(data);
	
					server.doctors.getData({id: data.appointment.doctor}).then(doctor_results => {
						setDoctorData(doctor_results.data);
					});
					
					server.clinics.get({id: data.appointment.clinic}).then(clinic_results => {
						setClinicData(clinic_results.data);
					});
	
					getPictureURL(data.appointment.patient).then(url => {
						setImage(url);
					});
	
					setArrived(data.appointment.arrived);
				}
				else {
					error(popupManager, results.data.message);
				}
				
			});
		}
	}, [appointment]);

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
				<div className="buttonBar">
					<Button
						label="Edit"
						link={"/specific/secretary/appointments/edit/" + appointment}
					/>
					<Button
						type={arrived ? "okay" : ""}
						label="Arrived"
						action={() => {
							server.appointments.arrived({appointment: appointment}).then(response => {
								if (response.data.success) {
									setArrived(response.data.current);
								}
								else {
									// Display error message popup.
									error(popupManager, response.data.message);
								}
							});
						}}
					/>
				</div>
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
		<Page title={title} subtitle={subtitle} popupManager={popupManager}>
			{display}
		</Page>
	);
}