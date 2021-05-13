//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from "../Common/Auth";
import { Redirect, useParams } from 'react-router-dom';
import { fn } from '../init';
import { Button } from "../Common/Components/Button";
import { SelectList } from "../Common/Components/SelectList";
import { SelectDate } from "../Common/Components/SelectDate";
import { Page } from "../Common/Components/Page";
import { SimpleDate, Time } from '../Common/classes';
import { Popup } from '../Common/Components/Popup';
import { capitalizeAll, capitalize } from '../Common/functions';

const getAppointment = fn.httpsCallable("appointments-get");
const getAvailableAppointments = fn.httpsCallable("appointments-getAvailable");

const makeAppointment = fn.httpsCallable("appointments-add");
const editAppointment = fn.httpsCallable("appointments-edit");
const cancelAppointment = fn.httpsCallable("appointments-cancel");

const getDoctor = fn.httpsCallable("doctors-getData");
const getClinic = fn.httpsCallable("clinics-get");

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
	
	const currentDate = new Date();
	
	//The ID of the appointment:
	const { appointment } = useParams();
	
	//The server data of the appointment:
	const [data, setData] = useState();

	//The ID of the doctor and clinic:
	const { doctor, clinic } = useParams();
	const [doctorID, setDoctorID] = useState();
	const [clinicID, setClinicID] = useState();
	
	const [type, setType] = useState(null);
	const [time, setTime] = useState();
	const [times, setTimes] = useState();
	const [date, setDate] = useState(SimpleDate.fromObject({
		year: currentDate.getUTCFullYear(),
		month: currentDate.getUTCMonth(),
		day: null
	}));

	const [success, setSuccess] = useState(null);
	const [deleted, setDeleted] = useState(null);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const [doctor_data, setDoctorData] = useState(null);
	const [clinic_data, setClinicData] = useState(null);

	const [problem, setProblem] = useState(null);

	useEffect(() => {
		if (appointment) {
			getAppointment({id: appointment}).then(results => {
				setData(results.data);
				setDoctorID(results.data.doctor.doctor.id);
				setClinicID(results.data.clinic.id);
				setType(results.data.appointment.type);
				setDate(SimpleDate.fromObject(results.data.extra.date));
				setTime(Time.fromObject(results.data.extra.time));
			});
		}
		else if (doctor && clinic && !doctorID && !clinicID) {
			setDoctorID(doctor);
			setClinicID(clinic);
		}
	}, [appointment, doctor, clinic]);

	useEffect(() => {
		if (doctorID && !doctor_data) {
			getDoctor({id: doctorID}).then(result => {
				setDoctorData(result.data);
			});
		}
  }, [doctorID]);
	
	useEffect(() => {
		if (clinicID && !clinic_data) {
			getClinic({id: clinicID}).then(response => {
				setClinicData(response.data);
			});
		}
  }, [clinicID]);

	useEffect(() => {
		if (date.day && date.month && date.year && (time || !appointment) && doctorID && clinicID) {
			getAvailableAppointments({
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
	}, [appointment, time, date, doctorID, clinicID])

	/**
	 * @todo Appointment types should be read from the doctor's configuration on the server.
	 */
	const types = ["new patient", "regular", "follow up"];

	let popups =
	<>
		{confirmDelete ?
			<ConfirmDelete
				appointment={appointment}
				close={() => setConfirmDelete(false)}
				success={() => setDeleted(true)}
			/>
		: ""}

		{problem ?
			<Popup title="Error" close={() => setProblem(false)}>
				<div>{problem}</div>
			</Popup>
		: ""}
	</>;

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
							
							editAppointment(new_data)
							.then(response => {
								if (response.data.messages.length > 0) {
									setProblem(response.data.messages.map(message => {
										return <p>{capitalize(message)}</p>;
									}));
								}

								setSuccess(response.data.id);
							})
							.catch(reason => {
								setProblem(capitalize(reason));
							});
						}
						else {
							// Set the appointment on the server:
							makeAppointment({
								doctor: doctor,
								clinic: clinic,
								patient: auth.user.uid,
								date: values.date.toObject(),
								time: values.time.toObject(),
								type: values.type
							})
							.then(response => {
								if (response.data.messages.length > 0) {
									setProblem(response.data.messages.map(message => {
										return <p>{capitalize(message)}</p>;
									}));
								}

								setSuccess(response.data.id);
							})
							.catch(reason => {
								setProblem(capitalize(reason));
							});
						}
					}}
				>
					<Form>
						{/* Put appointment-making widgets here. */}
						<div className="pickers">
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
									setDate(SimpleDate.fromObject(date));
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
									action={() => setConfirmDelete(true)}
								label="Delete" />
							: ""}
							<Button type="submit" label="Submit" />
						</div>
					</Form>
				</Formik>
				{popups}
				{(success ? <Redirect to={"/specific/user/appointments/success/" + success} /> : null)}
				{(deleted ? <Redirect to={"/specific/user/appointments/deleted"} /> : null)}
			</>;
	}

	return (
		<Page title={appointment ? "Change Your Appointment" : "Make an Appointment"} subtitle={subtitle}>
			{display}
		</Page>
	);
}

function ConfirmDelete({appointment, close, success}) {
	const [problem, setProblem] = useState(null);

	return (
		<Popup title="Confirm Deletion" close={close}>
			<p>Are you sure you wish to delete this shift?</p>
			<p>This action is permanent and cannot be undone.</p>
			<div className="buttonBar">
				<Button type="cancel" label="Yes" action={() => {
					cancelAppointment({appointment: appointment}).then(response => {
						if (!response.data.success) {setProblem(response.data.message)}
						else success();
					});
				}} />
				<Button type="okay" label="Cancel" action={close} />
				{problem ?
					<Popup title="Error" close={() => setProblem(false)}>
						<div>{problem}</div>
					</Popup>
				: ""}
			</div>
		</Popup>
	);
}