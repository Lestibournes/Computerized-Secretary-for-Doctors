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
import { Strings } from '../Common/Classes/strings';

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
			
						// Fetch the doctor's data:
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
						
						// Fetch the doctor's picture:
						getPictureURL(app_data.doctor).then(url => {
							setImage(url);
						});
					}
				}
				)
				.catch(reason => popups.error(reason.message));

				// Fetch the clinic data:
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
		subtitle = Strings.instance.get(56, new Map([["name", doctorData.fullName]]));
		display = 
		<>
			<TabbedContainer>
				<div title={Strings.instance.get(62)} icon="fa-calendar-alt">
					<div className="tab-controls">
						<Button
							label={Strings.instance.get(57)}
							link={root.get() + "/clinic/appointments/edit/" + clinic + "/" + appointment}
						/>
					</div>
					<div className="table tab-content">
						<b>{Strings.instance.get(58)}:</b> <span>{
						new SimpleDate(appointmentData.start.toDate()).toString() + " " + 
						Time.fromDate(appointmentData.start.toDate()).toString()
						}</span>
						<b>{Strings.instance.get(59)}:</b> <span>{Strings.instance.get(60, new Map([["duration", (appointmentData.end - appointmentData.start) / 60]]))}</span>
						<b>{Strings.instance.get(61)}:</b> <span>{capitalizeAll(appointmentData.type)}</span>
					</div>
				</div>

				<div title={Strings.instance.get(63)} icon="fa-info-circle">
					<div className="table tab-content">
						<b>{Strings.instance.get(65)}</b> <img src={image} alt={doctorData.fullName} />
						<b>{Strings.instance.get(66)}:</b> <span>{doctorData.fullName}</span>
						<b>{Strings.instance.get(67)}:</b>
						<span>
							{
								doctorData.sex === "male" ? Strings.instance.get(103) :
								doctorData.sex === "female" ? Strings.instance.get(104) :
								"Not specified"
							}
						</span>
					</div>
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