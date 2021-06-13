import "./AppointmentPage.css";

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

import { Field, Form, Formik } from "formik";
import * as Yup from 'yup';

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
	const [serverText, setServerText] = useState("");
	const [clientText, setClientText] = useState("");
	
	// Text Area styling:
	const [fontSize, setFontSize] = useState(1);

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
					setServerText(data.appointment.notes);
					setClientText(data.appointment.notes);

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
				<div key="Appointment Details" title="Appointment Details" icon="fa-calendar-alt">
					<div className="tab-controls">
						<Button
							icon="fas fa-edit"
							label="Edit"
							link={root.get() + "/clinic/appointments/edit/" + appointment}
						/>
						<Button
							type={arrived ? "okay" : ""}
							icon={arrived ? "fas fa-check-square" : "far fa-check-square"}
							label="Arrived"
							action={() => {
								server.appointments.arrived({appointment: appointment}).then(response => {
									if (!response.data.success) {
										// Display error message popup.\
										popupManager.error(response.data.message);
									}
								});
							}}
						/>
					</div>
					<div className="table tab-content">
						<b>Start:</b> <span>{
						SimpleDate.fromObject(appointmentData.extra.date).toString() + " " + 
						Time.fromObject(appointmentData.extra.time).toString()
						}</span>
						<b>Duration:</b> <span>{appointmentData.appointment.duration} minutes</span>
						<b>Type:</b> <span>{capitalizeAll(appointmentData.appointment.type)}</span>
					</div>
				</div>

				<div key="Patient Information" title="Patient Information" icon="fa-info-circle">
					<div className="table tab-content">
						<b>Photo</b> <img src={image} alt={appointmentData.patient.fullName} />
						<b>Name:</b> <span>{appointmentData.patient.fullName}</span>
						<b>Sex:</b> <span>{appointmentData.patient.sex ? capitalizeAll(appointmentData.patient.sex) : "Not specified"}</span>
					</div>
				</div>
				
				<div key="Documents" title="Documents" icon="fa-file-medical-alt">
					<div className="tab-content">
						To Do
					</div>
				</div>

				<div key="Chat" title="Chat" icon="fa-comment">
					<div className="tab-content">
						To Do
					</div>
				</div>

				<div key="Visit Notes" title="Visit Notes" icon="fa-clipboard">
					<Formik
						initialValues={{
							notes: serverText,
							font_size: fontSize ? fontSize : 16,
						}}
						validationSchema={Yup.object({
							notes: Yup.string()
								.required("Required"),
							font_size: Yup.number().min(0.25).max(40)
						})}
						onSubmit={async (values, { setSubmitting }) => {
							setSubmitting(true);
							
							server.appointments.saveNote({id: appointment, text: clientText}).then(response => {
								if (response.data.success) setServerText(response.data.text);
								else popupManager.error(response.data.message);
							});
						}}
					>
						<Form>
							<div className="tab-controls">
								<span className="controls-group">
									<span>Text size:</span>
									<Button
										icon="fas fa-minus"
										action={() => {
											if (fontSize > 0.5) {
												setFontSize(fontSize - 0.5);
											}
										}}
									/>
									<Field
										className="controls-input-number"
										name="font_size"
										type="number"
										value={fontSize}
										onChange={(e) => {
											if (e.target.value <= 0.5) setFontSize(0.5);
											else if (e.target.value >= 40) setFontSize(40);
											else setFontSize(Number(e.target.value));
										}}
									/>
									<Button
										icon="fas fa-plus"
										action={() => {
											setFontSize(fontSize + 0.5);
										}}
									/>
								</span>
								<Button
									type="submit"
									icon={serverText === clientText ? "fas fa-save" : "far fa-save"}
									label={serverText === clientText ? "Saved" : "Save"}
								/>
							</div>
							<Field
								className="tab-content notes"
								key="notes"
								name="notes"
								as="textarea"
								value={clientText}
								placeholder="Write notes on the appointment here."
								onChange={(e) => {
									setClientText(e.target.value)
								}}
								style={{fontSize: fontSize + "rem"}}
							/>
						</Form>
					</Formik>
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