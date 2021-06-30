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
import { db, fb } from '../init';
import { Loading } from '../Common/Components/Loading';
import { Strings } from '../Common/Classes/strings';

export function SetAppointmentPage() {
	const auth = useAuth();
	const popups = usePopups();
	const root = useRoot();

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
	const [typesData, setTypesData] = useState();
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
					setDate(new SimpleDate(app_snap.data().start.toDate()));
					setTime(Time.fromDate(app_snap.data().start.toDate()));

					setDoctorID(app_snap.data().doctor); 
					setClinicID(clinic);
				}
			})
			.catch(reason => popups.error(reason.message));
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
				const typesMap = new Map();
				const typesArray = [];
	
				for (const type of type_snaps.docs) {
					if (type.data().name) {
						typesMap.set(type.data().name, type.data().duration);
						typesArray.push(type.data());
					}
				}
	
				// Refresh the types options list for the display:

				const options = [];

				for (const type of typesArray) {
					if (type.name) options.push(type.name);
				}

				setTypesData(typesMap);
				setTypesOptions(options);
			})
			.catch(reason => popups.error(reason.code));
		}
  }, [clinicID, doctorID]);
	

	useEffect(() => {
		// Get the available times for setting appointments:
		if (date && type && (time || !appointment) && doctorID && clinicID) {
			server.appointments.getAvailable({
				clinic: clinicID,
				doctor: doctorID,
				date: date.toObject(),
				type: type
			})
			.then(results => {
				const list = [];

				results.data.forEach(result => {
					list.push(Time.fromObject(result.start));
				});

				// If the appointment already exists, add back in the time it is set to:
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
	let display = <Loading />;
	
	if ((data || !appointment) && doctorData && clinicData && typesData && minimum) {
		subtitle = Strings.instance.get(78, new Map([
			["doctor", doctorData.fullName],
			["clinic", clinicData.name],
			["city", clinicData.city]
		]));
		
		display = 
			<>
				{data ?
					<>
						<p>{Strings.instance.get(79, new Map([
							["type", capitalizeAll(data.type)],
							["date", new SimpleDate(data.start.toDate()).toString()],
							["time", Time.fromDate(data.start.toDate()).toString()]
						]))}
						</p>
						<p>{Strings.instance.get(80)}</p>
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
						const end_time = values.time.incrementMinutes(typesData.get(values.type) * minimum);
						const end = new Date(values.date.year, values.date.month, values.date.day, end_time.hours, end_time.minutes);

						if (data) {
							// If editing an existing appointment:
							db.collection("clinics").doc(clinic).collection("appointments").doc(appointment).update({
								start: start,
								end: end,
								offset: start.getTimezoneOffset(),
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
								offset: start.getTimezoneOffset(),
								type: values.type,
								verified: false
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
								popups.error(reason.message);
							});
						}
					}}
				>
					<Form>
						{/* Put appointment-making widgets here. */}
						<div className="pickers">
							<div className="widgets">
								<SelectList
									label={Strings.instance.get(81)}
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
									label={Strings.instance.get(82)}
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
										action={() => ConfirmDeletePopup(popups, clinicID, appointment, () => setDeleted(true))}
									label={Strings.instance.get(84)} />
								: ""}
								<Button type="submit" label={Strings.instance.get(83)} />
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
			<Header />
			<h1>{appointment ? Strings.instance.get(77) : Strings.instance.get(49)}</h1>
			<h2>{subtitle}</h2>
			<main>
				{display}
			</main>
		</div>
	);
}

function ConfirmDeletePopup(popups, clinic, appointment, success) {
		const close = () => {
			popups.remove(popup);
		}

		const popup = <Popup key="Confirm Appointment Deletion" title={Strings.instance.get(85)} close={close}>
			<p>{Strings.instance.get(86)}</p>
			<p>{Strings.instance.get(88)}</p>
			<div className="buttonBar">
				<Button type="cancel" label={Strings.instance.get(44)} action={() => {
					db.collection("clinics").doc(clinic).collection("appointments").doc(appointment).delete()
					.then(() => success())
					.catch(reason => popups.error(reason.message));
				}} />
				<Button type="okay" label={Strings.instance.get(89)} action={close} />
			</div>
		</Popup>

		popups.add(popup)
}