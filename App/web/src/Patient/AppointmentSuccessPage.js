//Reactjs:
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { usePopups } from '../Common/Popups';
import { Header } from '../Common/Components/Header';
import { Loading } from '../Common/Components/Loading';
import { db } from '../init';
import { Strings } from '../Common/Classes/strings';
import { useRoot } from '../Common/Root';
import { Button } from '../Common/Components/Button';

export function AppointmentSuccessPage() {
	const popups = usePopups();
	const root = useRoot();

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
		<>
			<p>
				{Strings.instance.get(55,
				new Map([
					["type", appointmentData.type],
					["name", doctorData.fullName],
					["clinic", clinicData.name],
					["city", clinicData.city],
					["date", new SimpleDate(appointmentData.start.toDate()).toString()],
					["time", Time.fromDate(appointmentData.start.toDate()).toString()]])
				)}
			</p>
			<p><Button link={root.get() + "/"} label={Strings.instance.get(54)} /></p>
		</>
	}

	return (
		<div className="Page">
			<Header />
			<h1>{Strings.instance.get(49)}</h1>
			<h2>{Strings.instance.get(51)}</h2>
			<main>
				{display}
			</main>
		</div>
	);
}