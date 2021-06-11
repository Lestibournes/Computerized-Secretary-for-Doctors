//Reactjs:
import { React, useEffect, useState } from 'react';
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { capitalizeAll, getPictureURL } from '../Common/functions';
import { useParams } from 'react-router-dom';
import { Button } from '../Common/Components/Button';
import { events, server } from '../Common/server';
import { usePopups } from '../Common/Popups';
import { TabbedContainer } from '../Common/Components/TabbedContainer';
import { Header } from '../Common/Components/Header';
import { useRoot } from '../Common/Root';

export function AppointmentPage() {
	const root = useRoot();
	/**
	 * @type {{appointment: string}}
	 */
	const {appointment} = useParams();

	const [appointmentData, setAppointmentData] = useState();
	const [doctorData, setDoctorData] = useState();
	const [clinicData, setClinicData] = useState();

	const [image, setImage] = useState(null); // The url of the patient's profile picture.
	const [arrived, setArrived] = useState(false); // The patient's arrival status.

	const popupManager = usePopups();
	
	useEffect(() => {
		if (appointment) {
			return server.appointments.get({id: appointment}).then(results => {
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

					return events.appointments.arrival(appointment, (appointment_id, arrived) => {
						setArrived(arrived);
					});
				}
				else {
					popupManager.error(results.data.message);
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
			<TabbedContainer>
				<div title="Appointment Details" icon="fa-calendar-alt">
					<div className="tab-controls">
						<Button
							label="Edit"
							link={root.get() + "/clinic/appointments/edit/" + appointment}
						/>
						<Button
							type={arrived ? "okay" : ""}
							label="Arrived"
							action={() => {
								server.appointments.arrived({appointment: appointment}).then(response => {
									if (!response.data.success) {
										// Display error message popup.
										popupManager.error(response.data.message);
									}
								});
							}}
						/>
					</div>
					<div className="table">
						<b>Start:</b> <span>{
						SimpleDate.fromObject(appointmentData.extra.date).toString() + " " + 
						Time.fromObject(appointmentData.extra.time).toString()
						}</span>
						<b>Duration:</b> <span>{appointmentData.appointment.duration} minutes</span>
						<b>Type:</b> <span>{capitalizeAll(appointmentData.appointment.type)}</span>
					</div>
				</div>

				<div title="Patient Information" icon="fa-info-circle">
					<div className="table">
						<b>Photo</b> <img src={image} alt={appointmentData.patient.fullName} />
						<b>Name:</b> <span>{appointmentData.patient.fullName}</span>
						<b>Sex:</b> <span>{appointmentData.patient.sex ? capitalizeAll(appointmentData.patient.sex) : "Not specified"}</span>
					</div>
				</div>
				
				<div title="Documents" icon="fa-file-medical-alt">
					<div>
						To Do
					</div>
				</div>

				<div title="Chat" icon="fa-comment">
					To Do
				</div>

				<div title="Visit Notes" icon="fa-clipboard">
					To Do
				</div>
			</TabbedContainer>
		</>;
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