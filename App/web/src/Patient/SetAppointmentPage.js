//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from "../Common/Auth";
import { Redirect, useParams } from 'react-router-dom';
import { Button } from "../Common/Components/Button";
import { SelectList } from "../Common/Components/SelectList";
import { SelectDate } from "../Common/Components/SelectDate";
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { Popup } from '../Common/Components/Popup';
import { capitalizeAll, capitalize, compareByName } from '../Common/functions';
import { server } from '../Common/server';
import { usePopups } from '../Common/Popups';
import { Header } from '../Common/Components/Header';
import { useRoot } from '../Common/Root';
import { db } from '../init';

/**
 * @todo
 * I want to have the appointment set for the doctor and the clinic together,
 * so the search page should perhaps show a separate result for every doctor+
 * clinic combination.
 * Show the information about the doctor so that the user can see that the
 * appointment is being set for the correct doctor.
 * Show widgets for selecting appoingment type, date, and time. They should
 * only show what's available. What isn't available should be greyed out.
 * The server side should make the determination in order to protect patient
 * privacy, and also the server side should handle the setting of the
 * appointment, making sure that it's valid.
 */
export function SetAppointmentPage() {
	const auth = useAuth();
	const popupManager = usePopups();
	const root = useRoot();
	
	//The root of the site:
	const { link } = useParams();

	//The ID of the appointment:
	const { appointment } = useParams();

	//The server data of the appointment:
	const [data, setData] = useState();

	//The ID of the doctor and clinic:
	const { doctor, clinic } = useParams();
	const [doctorID, setDoctorID] = useState();
	const [clinicID, setClinicID] = useState();
	
	const [typesData, setTypesData] = useState([]);
	const [type, setType] = useState(null);
	const [time, setTime] = useState();
	const [times, setTimes] = useState();
	const [date, setDate] = useState(new SimpleDate());

	const [success, setSuccess] = useState(null);
	const [deleted, setDeleted] = useState(null);

	const [doctor_data, setDoctorData] = useState(null);
	const [clinic_data, setClinicData] = useState(null);

	useEffect(() => {
		if (appointment) {
			server.appointments.get({id: appointment}).then(results => {
				if (results.data.success) {
					setData(results.data.data);
					setDoctorID(results.data.data.doctor.doctor.id);
					setClinicID(results.data.data.clinic.id);
					setType(results.data.data.appointment.type);
					setDate(SimpleDate.fromObject(results.data.data.extra.date));
					setTime(Time.fromObject(results.data.data.extra.time));
				}
				else popupManager.error(results.data.message)
			});
		}
		else if (doctor && clinic && !doctorID && !clinicID) {
			setDoctorID(doctor);
			setClinicID(clinic);
		}
	}, [appointment, doctor, clinic]);

	useEffect(() => {
		if (doctorID && !doctor_data) {
			server.doctors.getData({id: doctorID}).then(result => {
				setDoctorData(result.data);
			});
		}
  }, [doctorID]);
	
	useEffect(() => {
		if (clinicID && !clinic_data) {
			server.clinics.get({id: clinicID}).then(response => {
				setClinicData(response.data);
			});
		}
  }, [clinicID]);

	useEffect(() => {
		if (date.day && date.month && date.year && type && (time || !appointment) && doctorID && clinicID) {
			server.appointments.getAvailable({
				doctor: doctorID,
				clinic: clinicID,
				date: date.toObject(),
				type: type
			})
			.then(results => {
				const list = [];

				results.data.forEach(result => {
					list.push(Time.fromObject(result.start));
				});

				if (time) {
					for (let i = 0; i < list.length; i++) {
						if (list[i].compare(time) === 0) {
							break;
						}
						else if (i === list.length - 1) {
							list.push(Time.fromObject(time));
						};
					}
				}

				list.sort((a, b) => {return a.compare(b)});

				setTimes(list);
			});
		}
	}, [appointment, time, date, type, doctorID, clinicID])

	useEffect(() => {
		if (clinicID && doctorID) {
			db.collection("clinics").doc(clinicID).collection("doctors").doc(doctorID).collection("types").get()
			.then(type_snaps => {
				const types = [];
	
				for (const type of type_snaps.docs) {
					console.log(type.data());
					if (type.data().name) {
						types.push(type.data());
					}
				}
	
				types.sort(compareByName);
				setTypesData(types);
			})
			.catch(reason => popupManager.error(reason));
		}
	}, [clinicID, doctorID]);

	/**
	 * @todo Appointment types should be read from the doctor's configuration on the server.
	 */
	const types = [];

	for (const type of typesData) {
		if (type.name) types.push(type.name);
	}

	let subtitle;
	let display;
	
	if ((data || !appointment) && doctor_data && clinic_data) {
		subtitle = 
			"Appointment Details" + 
			(doctor_data ? " for Dr. " + doctor_data.user.firstName + " " + doctor_data.user.lastName : "") + 
			(clinic_data ? " at " + clinic_data.name + ", " + clinic_data.city : "");
		
		display = 
			<>
				{data ?
					<>
						<p>
							Currently the appointment is a <b>{capitalizeAll(data.appointment.type)}</b> appointment
							on <b>{SimpleDate.fromObject(data.extra.date).toString()}</b>
							at <b>{Time.fromObject(data.extra.time).toString()}</b>.
						</p>
						<p>You can change the time, data, and type of your appointment below, or cancel your appointment.</p>
					</>
				: ""}
				<Formik
					initialValues={{
						type: (type ? type : ""),
						date: (date ? date : ""),
						time: (time ? time : "")
					}}
					validationSchema={Yup.object({
						type: Yup.string(),
						date: Yup.object({
							year: Yup.number(),
							month: Yup.number(),
							day: Yup.number(),
						}),
						time: Yup.object({
							hours: Yup.number(),
							minutes: Yup.number()
						})
					})}
					onSubmit={async (values, { setSubmitting }) => {
						setSubmitting(true);

						if (data) {
							let new_data = {
								appointment: appointment
							};

							if (values.time) {
								new_data.time = values.time.toObject();
							}
							
							if (values.date) {
								new_data.date = values.date.toObject();
							}

							if (values.type) {
								new_data.type = values.type;
							}
							
							server.appointments.edit(new_data).then(response => {
								if (response.data.success) setSuccess(response.data.id);
								else popupManager.error(response.data.message)
							})
							.catch(reason => popupManager.error(reason))
						}
						else {
							// Set the appointment on the server:
							server.appointments.add({
								doctor: doctor,
								clinic: clinic,
								patient: auth.user.uid,
								date: values.date.toObject(),
								time: values.time.toObject(),
								type: values.type
							})
							.then(response => {
								if (response.data.messages.length > 0) {
									popupManager.error(
										response.data.messages.map(message => {
											return <p>{capitalize(message)}</p>;
										})
									);
								}

								setSuccess(response.data.id);
							})
							.catch(reason => popupManager.error(capitalize(reason)))
						}
					}}
				>
					<Form>
						{/* Put appointment-making widgets here. */}
						<div className="pickers">
							<div className="widgets">
								<SelectList
									label="Appointment Type"
									name="type"
									options={types}
									selected={type}
									onClick={(index) => setType(index)}
								/>
								<SelectDate
									name="date"
									selected={date}
									onClick={(date) => {
										setDate(date);
									}}
								/>
								<SelectList
									label="Time Slot"
									name="time"
									options={times}
									selected={time}
									onClick={(time) => setTime(time)}
								/>
							</div>
							<div className="buttonBar">
								{appointment ? 
									<Button
										type="cancel"
										action={() => ConfirmDeletePopup(popupManager, appointment, () => setDeleted(true))}
									label="Delete" />
								: ""}
								<Button type="submit" label="Submit" />
							</div>
						</div>
					</Form>
				</Formik>
				{(success ? <Redirect to={root.get() + "/user/appointments/success/" + success} /> : null)}
				{(deleted ? <Redirect to={root.get() + "/user/appointments/deleted"} /> : null)}
			</>;
	}

	return (
		<div className="Page">
			<Header link={link} />
			<h1>{appointment ? "Modify Appointment" : "Make an Appointment"}</h1>
			<h2>{subtitle}</h2>
			<main>
				{display}
			</main>
		</div>
	);
}

function ConfirmDeletePopup(popupManager, appointment, success) {
		const close = () => {
			popupManager.remove(popup);
		}

		const popup = <Popup key="Confirm Appointment Deletion" title="Confirm Deletion" close={close}>
			<p>Are you sure you wish to delete this appointment?</p>
			<p>This action is permanent and cannot be undone.</p>
			<div className="buttonBar">
				<Button type="cancel" label="Yes" action={() => {
					server.appointments.cancel({appointment: appointment}).then(response => {
						if (!response.data.success) popupManager.error(capitalize(response.data.message))
						else success();
					});
				}} />
				<Button type="okay" label="Cancel" action={close} />
			</div>
		</Popup>

		popupManager.add(popup)
}