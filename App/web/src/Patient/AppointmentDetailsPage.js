//Reactjs:
import { React, useEffect, useState } from 'react';
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { capitalizeAll, getPictureURL } from '../Common/functions';
import { useParams } from 'react-router-dom';
import { Button } from '../Common/Components/Button';
import { usePopups } from '../Common/Popups';
import { TabbedContainer } from '../Common/Components/TabbedContainer';
import { Header } from '../Common/Components/Header';
import { useRoot } from '../Common/Root';
import { db } from '../init';

export function AppointmentDetailsPage() {
	const root = useRoot();
	/**
	 * @type {{appointment: string}}
	 */
	const {clinic, appointment} = useParams();

	const [appointmentData, setAppointmentData] = useState();
	const [doctorData, setDoctorData] = useState();
	const [clinicData, setClinicData] = useState();

	const [image, setImage] = useState(null); // The url of the doctor's profile picture.

	const popups = usePopups();
	
	// Fetch appointment data:
	useEffect(() => {
		if (appointment) {
			db.collection("clinics").doc(clinic).collection("appointments").doc(appointment).get().then(
				app_snap => {
					if (app_snap.exists) {
						const app_data = app_snap.data();
						app_data.id = app_snap.id;
						setAppointmentData(app_data);
			
						db.collection("users").doc(app_data.doctor).get().then(
							doctor_snap => {
								if (doctor_snap.exists) {
									const doctor_data = doctor_snap.data();
									doctor_data.id = doctor_snap.id;
									setDoctorData(doctor_data);
								}
							}
						)
						.catch(reason => popups.error(reason.message));
						
						
						getPictureURL(app_data.doctor).then(url => {
							setImage(url);
						});
					}
				}
				)
				.catch(reason => popups.error(reason.message));

				db.collection("clinics").doc(clinic).get().then(
					clinic_snap => {
						const clinic_data = clinic_snap.data();
						clinic_data.id = clinic_snap.id;
						setClinicData(clinic_data);
					}
				)
				.catch(reason => popups.error(reason.message));
		}
	}, [appointment]);

	let display;
	let subtitle;
	let title;

	if (appointmentData && doctorData && clinicData) {
		title = clinicData.name;
		subtitle = "Dr. " + doctorData.fullName + "'s Appointment";
		display = 
		<>
			<TabbedContainer>
				<div title="Appointment Details" icon="fa-calendar-alt">
					<div className="tab-controls">
						<Button
							label="Edit"
							link={root.get() + "/clinic/appointments/edit/" + clinic + "/" + appointment}
						/>
					</div>
					<div className="table tab-content">
						<b>Start:</b> <span>{
						new SimpleDate(appointmentData.start.toDate()).toString() + " " + 
						Time.fromDate(appointmentData.start.toDate()).toString()
						}</span>
						<b>Duration:</b> <span>{(appointmentData.end - appointmentData.start) / 60} minutes</span>
						<b>Type:</b> <span>{capitalizeAll(appointmentData.type)}</span>
					</div>
				</div>

				<div title="Doctor Information" icon="fa-info-circle">
					<div className="table tab-content">
						<b>Photo</b> <img src={image} alt={doctorData.fullName} />
						<b>Name:</b> <span>{doctorData.fullName}</span>
						<b>Sex:</b> <span>{doctorData.sex ? capitalizeAll(doctorData.sex) : "Not specified"}</span>
					</div>
				</div>
				
				<div title="Documents" icon="fa-file-medical-alt">
					<div>
						<div className="tab-content">To Do</div>
					</div>
				</div>

				<div title="Chat" icon="fa-comment">
					<div className="tab-content">To Do</div>
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