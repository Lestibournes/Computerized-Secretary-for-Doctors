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
	const popups = usePopups();
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

	const [doctorData, setDoctorData] = useState(null);
	const [clinicData, setClinicData] = useState(null);
	
	// Appointment types/durations:
	const [minimum, setMinimum] = useState();
	const [typesData, setTypesData] = useState([]);
	const [typesOptions, setTypesOptions] = useState([]);
	const [type, setType] = useState(null);

	// Time and date:
	const [time, setTime] = useState();
	const [times, setTimes] = useState();
	const [date, setDate] = useState(new SimpleDate());

	// For complete actions:
	const [success, setSuccess] = useState(null);
	const [deleted, setDeleted] = useState(null);

	useEffect(() => {
		if (clinic && appointment) {
			// If it's an existing appointment, load the appointment data:
			db.collection("clinics").doc(clinic).collection("appointments").doc(appointment).get()
			.then(app_snap => {
				if (app_snap.exists) {
					setData(app_snap.data()); // Appointment data

					setType(app_snap.data().type);
					setDate(new SimpleDate(app_snap.data().start));
					setTime(Time.fromDate(app_snap.data().start));

					setDoctorID(app_snap.data().doctor); 
					setClinicID(clinic);
				}
			})
			.catch(reason => popups.error(reason.code));
		}
		else if (clinic && doctor) {
			// If it's a new appointment:
			setDoctorID(doctor);
			setClinicID(clinic);
		}
	}, [clinic, doctor, appointment]);

	useEffect(() => {
		// Get the doctor's user data:
		if (doctorID) {
			db.collection("users").doc(doctorID).get()
			.then(doctor_snap => {
				const data = doctor_snap.data();
				data.id = doctor_snap.id;
				setDoctorData(data);
			})
			.catch(reason => popups.error(reason.code));
		}

		// Get the clinic's public data:
		if (clinicID) {
			db.collection("clinics").doc(clinicID).get()
			.then(clinic_snap => {
				const data = clinic_snap.data();
				data.id = clinic_snap.id;
				setClinicData(data);
			})
		}

		if (clinicID && doctorID) {
			const doctorRef = db.collection("clinics").doc(clinicID).collection("doctors").doc(doctorID);

			// Get the minimum appointment duration:
			doctorRef.get()
			.then(doctor_snap => setMinimum(doctor_snap.data().minimum))
			.catch(reason => popups.error(reason.code));

			// Get the data of the different appointlment types:
			doctorRef.collection("types").get()
			.then(type_snaps => {
				const types = [];
	
				for (const type of type_snaps.docs) {
					if (type.data().name) {
						types.push(type.data());
					}
				}
	
				// Refresh the types options list for the display:
				types.sort(compareByName);
				setTypesData(types);

				const options = [];

				for (const type of types) {
					if (type.name) options.push(type.name);
				}

				setTypesOptions(options);
			})
			.catch(reason => popups.error(reason.code));
		}
  }, [clinicID, doctorID]);
	

	useEffect(() => {
		// Get the available times for setting appointments:
		console.log(date.toDate().getTime());
		if (date && type && (time || !appointment) && doctorID && clinicID) {
			server.appointments.getAvailable({
				clinic: clinicID,
				doctor: doctorID,
				date: date.toDate().getTime(),
				type: type
			})
			.then(results => {
				const list = [];

				results.data.forEach(result => {
					list.push(Time.fromObject(result.start));
				});

				// If the appointment already exists, add back it the time it is set to:
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

	// Build the display:

	let subtitle;
	let display;
	
	if ((data || !appointment) && doctorData && clinicData) {
		subtitle = 
			"Appointment Details" + 
			(doctorData ? " for Dr. " + doctorData.fullName : "") + 
			(clinicData ? " at " + clinicData.name + ", " + clinicData.city : "");
		
		display = 
			<>
				{data ?
					<>
						<p>
							Currently the appointment is a <b>{capitalizeAll(data.type)}</b> appointment
							on <b>{new SimpleDate(data.start).toString()}</b>
							at <b>{Time.fromDate(data.start).toString()}</b>.
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

						const start = new Date(values.date.year, values.date.month, values.date.day, values.time.hours, values.time.minutes);
						const end_time = values.time.incrementMinutes(minimum);
						const end = new Date(values.date.year, values.date.month, values.date.day, end_time.hours, end_time.minutes);
						if (data) {
							// If editing an existing appointment:
							db.collection("clinics").doc(clinic).collection("appointments").doc(appointment).update({
								start: start,
								end: end,
								type: values.type
							})
							.then(app_ref => app_ref.get().then(app_snap => {
								if (app_snap.exists) {
									const app_data = app_snap.data();
									app_data.id = app_snap.id;
									setSuccess(app_data);
								}
								else {
									popups.error("Modifying the appointment failed");
								}
							}))
							.catch(reason => popups.error(reason.code));
						}
						else {
							// If creating a new appointment:
							db.collection("clinics").doc(clinic).collection("appointments").add({
								doctor: doctor,
								clinic: clinic,
								patient: auth.user.uid,
								start: start,
								end: end,
								type: values.type
							})
							.then(app_ref => app_ref.get().then(app_snap => {
								if (app_snap.exists) {
									const app_data = app_snap.data();
									app_data.id = app_snap.id;
									setSuccess(app_data);
								}
								else {
									popups.error("Creating the appointment failed");
								}
							}))
							.catch(reason => {
								console.log(reason);
								popups.error(reason.code);
							});
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
									options={typesOptions}
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
										action={() => ConfirmDeletePopup(popups, appointment, () => setDeleted(true))}
									label="Delete" />
								: ""}
								<Button type="submit" label="Submit" />
							</div>
						</div>
					</Form>
				</Formik>
				{(success ? <Redirect to={root.get() + "/user/appointments/success/" + success.clinic + "/" + success.id} /> : null)}
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

function ConfirmDeletePopup(popups, appointment, success) {
		const close = () => {
			popups.remove(popup);
		}

		const popup = <Popup key="Confirm Appointment Deletion" title="Confirm Deletion" close={close}>
			<p>Are you sure you wish to delete this appointment?</p>
			<p>This action is permanent and cannot be undone.</p>
			<div className="buttonBar">
				<Button type="cancel" label="Yes" action={() => {
					server.appointments.cancel({appointment: appointment}).then(response => {
						if (!response.data.success) popups.error(capitalize(response.data.message))
						else success();
					});
				}} />
				<Button type="okay" label="Cancel" action={close} />
			</div>
		</Popup>

		popups.add(popup)
}