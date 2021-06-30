import "./AppointmentPage.css";

//Reactjs:
import { React, useEffect, useState } from 'react';
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { capitalizeAll, getPictureURL } from '../Common/functions';
import { useParams } from 'react-router-dom';
import { Button } from '../Common/Components/Button';
import { events } from '../Common/server';
import { usePopups } from '../Common/Popups';
import { TabbedContainer } from '../Common/Components/TabbedContainer';
import { Header } from '../Common/Components/Header';
import { useRoot } from '../Common/Root';

import { Field, Form, Formik } from "formik";
import * as Yup from 'yup';
import { db } from "../init";
import { Strings } from "../Common/Classes/strings";

export function AppointmentPage() {
	const root = useRoot();
	/**
	 * @type {{appointment: string}}
	 */
	const {clinic, appointment} = useParams();

	const [appointmentData, setAppointmentData] = useState();
	const [patientData, setPatientData] = useState();
	const [doctorData, setDoctorData] = useState();
	const [clinicData, setClinicData] = useState();

	const [image, setImage] = useState(null); // The url of the patient's profile picture.
	const [arrived, setArrived] = useState(false); // The patient's arrival status.
	const [serverText, setServerText] = useState("");
	const [clientText, setClientText] = useState("");
	
	// Text Area styling:
	const [fontSize, setFontSize] = useState(1);

	const popups = usePopups();
	
	useEffect(() => {
		if (clinic && appointment) {
			db.collection("clinics").doc(clinic).collection("appointments").doc(appointment).get()
			.then(
				app_snap => {
					if (app_snap.exists) {
						const app_data = app_snap.data();
						app_data.id = app_snap.id;

						setAppointmentData(app_data);
						setArrived(app_data.arrived);
						setServerText(app_data.notes);
						setClientText(app_data.notes);

						db.collection("users").doc(app_data.doctor).get()
						.then(
							doctor_snap => {
								if (doctor_snap.exists) {
									const doctor_data = doctor_snap.data();
									doctor_data.id = doctor_snap.id;
									setDoctorData(doctor_data);
								}
							}
						)
						.catch(reason => popups.error(reason.message));

						db.collection("users").doc(app_data.patient).get()
						.then(
							patient_snap => {
								if (patient_snap.exists) {
									const patient_data = patient_snap.data();
									patient_data.id = patient_snap.id;
									setPatientData(patient_data);
								}
							}
						)
						.catch(reason => popups.error(reason.message));

						getPictureURL(app_data.patient).then(
							url => {
								setImage(url);
							}
						)
						.catch(reason => popups.error(reason.message));
					}
				}
			)
			.catch(reason => popups.error(reason.message));

			db.collection("clinics").doc(clinic).get()
			.then(
				clinic_snap => {
					if (clinic_snap.exists) {
						const clinic_data = clinic_snap.data();
						clinic_data.id = clinic_snap.id;
						setClinicData(clinic_data);
					}
				}
			)
			
		}
	}, [appointment]);
	
	useEffect(() => {
		if (appointment, appointmentData) {
			return events.clinics.appointment(appointmentData.clinic, appointment, (oldData, newData) => {
				if (newData) setArrived(newData.arrived);
			});
		}
	}, [appointment, appointmentData]);

	let display;
	let subtitle;
	let title;

	if (appointmentData && patientData && doctorData && clinicData) {
		title = clinicData.name;
		subtitle = Strings.instance.get(93, new Map([["patient", patientData.fullName]]));
		display = 
		<>
			<TabbedContainer>
				<div key="Appointment Details" title={Strings.instance.get(62)} icon="fa-calendar-alt">
					<div className="tab-controls">
						<Button
							icon="fas fa-edit"
							label={Strings.instance.get(57)}
							link={root.get() + "/clinic/appointments/edit/" + clinic + "/" + appointment}
						/>
						<Button
							type={arrived ? "okay" : ""}
							icon={arrived ? "fas fa-check-square" : "far fa-check-square"}
							label={Strings.instance.get(94)}
							action={() => {
								db.collection("clinics").doc(clinic).collection("appointments").doc(appointment).update({arrived: !arrived})
								.catch(reason => popups.error(reason.message));
							}}
						/>
					</div>
					<div className="table tab-content">
						<b>{Strings.instance.get(58)}:</b> <span>{
						new SimpleDate(appointmentData.start.toDate()).toString() + " " + 
						Time.fromDate(appointmentData.start.toDate()).toString()
						}</span>
						<b>{Strings.instance.get(59)}:</b> <span>{(appointmentData.end - appointmentData.start) / 60} minutes</span>
						<b>{Strings.instance.get(61)}:</b> <span>{capitalizeAll(appointmentData.type)}</span>
					</div>
				</div>

				<div key="Patient Information" title={Strings.instance.get(96)} icon="fa-info-circle">
					<div className="table tab-content">
						<b>{Strings.instance.get(65)}</b> <img src={image} alt={patientData.fullName} />
						<b>{Strings.instance.get(66)}:</b> <span>{patientData.fullName}</span>
						<b>{Strings.instance.get(67)}:</b> <span>{patientData.sex ? capitalizeAll(patientData.sex) : "Not specified"}</span>
					</div>
				</div>
				
				<div key="Documents" title={Strings.instance.get(68)} icon="fa-file-medical-alt">
					<div className="tab-content">
						To Do
					</div>
				</div>

				<div key="Chat" title={Strings.instance.get(69)} icon="fa-comment">
					<div className="tab-content">
						To Do
					</div>
				</div>

				<div key="Visit Notes" title={Strings.instance.get(98)} icon="fa-clipboard">
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
							
							db.collection("clinics").doc(clinic).collection("appointments").doc(appointment).update({notes: clientText})
							.then(() => setServerText(clientText))
							.catch(reason => popups.error(reason.message));
						}}
					>
						<Form>
							<div className="tab-controls">
								<span className="controls-group">
									<span>{Strings.instance.get(99)}:</span>
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
									label={serverText === clientText ? Strings.instance.get(100) : Strings.instance.get(101)}
								/>
							</div>
							<Field
								className="tab-content notes"
								key="notes"
								name="notes"
								as="textarea"
								value={clientText}
								placeholder={Strings.instance.get(102)}
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