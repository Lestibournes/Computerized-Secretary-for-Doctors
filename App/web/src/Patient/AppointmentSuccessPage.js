//Reactjs:
import React, { useEffect, useState } from 'react';
import { MainHeader, useAuth } from "../Common/CommonComponents";
import { Redirect, useParams } from 'react-router-dom';
import { db, fn } from '../init';

const getDoctor = fn.httpsCallable("getDoctor");

export function AppointmentSuccessPage() {
	const auth = useAuth();
	const { appointment } = useParams(); //The ID of the doctor and clinic.
	
	const [doctor_data, setDoctor] = useState(null);
	const [clinic_data, setClinic] = useState(null);
	const [appointment_data, setAppointment] = useState(null);
	const tzos = (new Date()).getTimezoneOffset() / 60;
	const [date, setDate] = useState(new Date());

	useEffect(() => {
		db.collection("appointments").doc(appointment).get().then(result => {
			setAppointment(result.data());
			let date = result.data().start.toDate();
			setDate(date);
			getDoctor({
				id: result.data().doctor,
				clinic: result.data().clinic
			}).then(result => {
				setDoctor(result.data);
			});
		
			db.collection("clinics").doc(result.data().clinic).get().then(result => {
				setClinic(result.data());
			});
		});
  }, []);

	return (
		<div className="page">
			{!auth.user ? <Redirect to="/general/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="content">

				<div className="searchbar">
					<h1>Make an Appointment</h1>
					<h2>Success!</h2>
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
				</div>
			</div>
		</div>
	);
}