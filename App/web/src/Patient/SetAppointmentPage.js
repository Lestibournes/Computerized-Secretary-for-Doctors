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
	const [time, setTime] = useState(null);
	const [times, setTimes] = useState([]);
	const [date, setDate] = useState(SimpleDate.fromObject({
		year: currentDate.getUTCFullYear(),
		month: currentDate.getUTCMonth(),
		day: null
	}));

	const [success, setSuccess] = useState(null);
	const [deleted, setDeleted] = useState(null);

	const [doctor_data, setDoctorData] = useState(null);
	const [clinic_data, setClinicData] = useState(null);

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
		if (date.day && date.month && date.year) {
			getAvailableAppointments({
				doctor: doctorID,
				clinic: clinicID,
				date: date.toObject(),
				type: type
			})
			.then(results => {
				const times = [];

				results.data.forEach(result => {
					times.push((result.start.hours) + ":" + (result.start.minutes < 10 ? "0" : "") + result.start.minutes);
				});

				setTimes(times);
			});
		}
	}, [date])

	const types = ["new patient", "regular", "follow up"];//Temporary. Should be read from the doctor's configuration on the server.
	// const tzos = (new Date()).getTimezoneOffset() / 60;

	return (
		<Page
			title={data ? "Change Your Appointment" : "Make an Appointment"}
			subtitle={"Appointment Details" + 
				(doctor_data ? " for Dr. " + doctor_data.user.firstName + " " + doctor_data.user.lastName : "") + 
				(clinic_data ? " at " + clinic_data.name + ", " + clinic_data.city : "")
			}
			content={
			<>
				{data ?
				<>
					<p>
						Currently the appointment is a <b>{data.appointment.type}</b> appointment
						on <b>{SimpleDate.fromObject(data.extra.date).toString()}</b>
						at <b>{Time.fromObject(data.extra.time).toString()}</b>.
					</p>
					<p>You can change the time, data, and type of your appointment below, or cancel your appointment.</p>
				</>
				: ""}
				<Formik
					initialValues={{}}
					validationSchema={Yup.object({
						type: Yup.string(),
						date: Yup.date(),
						time: Yup.string(),
					})}
					onSubmit={async (values, { setSubmitting }) => {
						setSubmitting(true);

						if (data) {
							let new_data = {
								appointment: appointment
							};

							if (time) {
								new_data.time = {
									hours: Number(("" + times[time]).split(":")[0]),
									minutes: Number(("" + times[time]).split(":")[1])
								};
							}
							
							if (date) {
								new_data.date = date.toObject();
							}

							if (type) {
								new_data.type = types[type];
							}
							
							editAppointment(new_data)
							.then(response => {
								if (response.data.messages.length > 0) {
									for (let i = 0; i < response.data.messages.length; i++) {
										console.log(response.data.messages[i]);
									}
								}

								setSuccess(response.data.id);
							})
							.catch(reason => {
								console.log(reason);
							});
						}
						else {
							// Set the appointment on the server:
							makeAppointment({
								doctor: doctor,
								clinic: clinic,
								patient: auth.user.uid,
								date: date.toObject(),
								time: {
									hours: Number(("" + times[time]).split(":")[0]),
									minutes: Number(("" + times[time]).split(":")[1])
								},
								type: types[type]
							})
							.then(response => {
								if (response.data.messages.length > 0) {
									for (let i = 0; i < response.data.messages.length; i++) {
										console.log(response.data.messages[i]);
									}
								}
								
								setSuccess(response.data.id);
							})
							.catch(reason => {
								console.log(reason);
							});
						}
					}}
				>
					<Form>
						{/* Put appointment-making widgets here. */}
						<div className="pickers">
							<SelectList
								label="Appointment Type"
								id="type"
								options={types}
								selected={type}
								onClick={(index) => setType(index)}
							/>
							<SelectDate
								id="date"
								day={date.day}
								month={date.month}
								year={date.year}
								onClick={(date) => {
									setDate(SimpleDate.fromObject(date));
								}}
							/>
							<SelectList
								label="Time Slot"
								id="time"
								options={times}
								selected={time}
								onClick={(time) => setTime(time)}
							/>
						</div>
						<div className="buttonBar">
						<Button type="cancel" action={() => {
							cancelAppointment({appointment: appointment}).then(response => {
								if (response.data.success) {
									setDeleted(true);
								}
								else {
									response.data.messages.forEach(message => {
										console.log(message)
									});
								}
							});
							}}
							label="Delete" />
							<Button type="submit" label="Submit" />
						</div>
					</Form>
				</Formik>
				{(success ? <Redirect to={"/specific/user/appointments/success/" + success} /> : null)}
				{(deleted ? <Redirect to={"/specific/user/appointments/deleted"} /> : null)}
			</>
			}
		/>
	);
}