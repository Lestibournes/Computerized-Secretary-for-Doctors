//Reactjs:
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { usePopups } from '../Common/Popups';
import { Header } from '../Common/Components/Header';
import { Loading } from '../Common/Components/Loading';
import { db } from '../init';

export function AppointmentSuccessPage() {
	const popups = usePopups();

	const { clinic, appointment } = useParams(); //The ID of the doctor and clinic.
	
	const [doctorData, setDoctorData] = useState();
	const [clinicData, setClinicData] = useState();
	const [appointmentData, setAppointmentData] = useState();

	useEffect(() => {
		if (clinic && appointment) {
			db.collection("clinics").doc(clinic).collection("appointments").doc(appointment).get().then(
				app_snap => {
					const app_data = app_snap.data();
					app_data.id = app_snap.id;
					setAppointmentData(app_data);
	
					db.collection("users").doc(app_data.doctor).get().then(
						doctor_snap => {
							const doctor_data = doctor_snap.data();
							doctor_data.id = doctor_snap.id;
							setDoctorData(doctor_data);
						}
					)
					.catch(reason => popups.error(reason.message));
				}
			)
			.catch(reason => popups.error(reason.message));
		}

		if (clinic) {
			db.collection("clinics").doc(clinic).get().then(
				clinic_snap => {
					const clinic_data = clinic_snap.data();
					clinic_data.id = clinic_snap.id;
					setClinicData(clinic_data);
				}
			)
			.catch(reason => popups.error(reason.message));
		}
  }, [clinic, appointment]);

	let display = <Loading />;

	if (appointmentData && doctorData && clinicData) {
		display =
		<p>
			You have a <b>{appointmentData.type}</b> appointment with Dr.
			<b> {doctorData.fullName}</b> at
			<b> {clinicData.name}, {clinicData.city}</b> on
			<b> {new SimpleDate(appointmentData.start.toDate()).toString()}</b> at
			<b> {Time.fromDate(appointmentData.start.toDate()).toString()}</b>
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