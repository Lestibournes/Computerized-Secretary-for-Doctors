//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from "../Common/Auth";
import { Redirect, useParams } from 'react-router-dom';
import { fn } from '../init';
import { SimpleDate, Time } from '../Common/classes';
import { SelectList } from '../Common/Components/SelectList';
import { SelectDate } from '../Common/Components/SelectDate';
import { Button } from '../Common/Components/Button';
import { Page } from '../Common/Components/Page';

const getAvailableAppointments = fn.httpsCallable("appointments-getAvailable");
const getAppointment = fn.httpsCallable("appointments-get");
const editAppointment = fn.httpsCallable("appointments-edit");
const cancelAppointment = fn.httpsCallable("appointments-cancel");
const getDoctor = fn.httpsCallable("doctors-getData");


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
export function EditAppointmentPage(props) {
	const selectDate = (date) => {
		date = SimpleDate.fromObject(date)
		setDate(date);

		if (date.day && date.month && date.year) {
			console.log(data.doctor.doctor.id);
			getAvailableAppointments({
				doctor: data.doctor.doctor.id,
				clinic: data.clinic.id,
				date: date.toObject(),
				type: type
			}).then(results => {
					const times = [];

					results.data.forEach(result => {
						times.push((result.start.hours - tzos) + ":" + (result.start.minutes < 10 ? "0" : "") + result.start.minutes);
					});

					setTimes(times);
				});
		}
	}

	const currentDate = new Date();
	const auth = useAuth();
	
	const { appointment } = useParams(); //The ID of the appointment.
	
	const [data, setData] = useState(null); //The data of the appointment.

	const [type, setType] = useState(null);
	const [time, setTime] = useState(null);
	const [times, setTimes] = useState([]);
	const [date, setDate] = useState(SimpleDate.fromDate(new Date()));

	const [success, setSuccess] = useState(null);
	const [deleted, setDeleted] = useState(null);

	const [doctor_data, setDoctor] = useState(null);
	const [clinic_data, setClinic] = useState(null);

	const types = ["new patient", "regular", "follow up"];//Temporary. Should be read from the doctor's configuration on the server.
	const tzos = (new Date()).getTimezoneOffset() / 60;

	useEffect(() => {
		getAppointment({id: appointment}).then(response => {
			response.data.extra.time = Time.fromObject(response.data.extra.time);
			response.data.extra.date = SimpleDate.fromObject(response.data.extra.date);

			setData(response.data);
			setDate(response.data.extra.date);
			setDoctor(response.data.doctor);
			setClinic(response.data.clinic);
		});
  }, []);

	useEffect(() => {
		if (data && date.compare(data.extra.date) != 0) {
			selectDate(data.extra.date);
		}
	}, [data]);

	return (
		<Page
			title="Change Your Appointment"
			subtitle={
				"Appointment Details" + 
				(doctor_data ? " for Dr. " + doctor_data.user.firstName + " " + doctor_data.user.lastName : null) + 
				(clinic_data ? " at " + clinic_data.name + ", " + clinic_data.city : null)
			}
			content={
				<>
					<p>Currently the appointment is a <b>{data ? data.appointment.type : null}</b> appointment on <b>{data ? data.extra.date.day + "/" + (data.extra.date.month + 1) + "/" + data.extra.date.year : null}</b> at <b>{data ? data.extra.time.toString() : null}</b>.</p>
					<p>You can change the time, data, and type of your appointment below, or cancel your appointment.</p>
					<Formik
						initialValues={{}}
						validationSchema={Yup.object({
							type: Yup.string(),
							date: Yup.date(),
							time: Yup.string(),
						})}
						onSubmit={async (values, { setSubmitting }) => {
							setSubmitting(true);

							let new_data = {
								appointment: appointment
							};

							if (time) {
								new_data.time = {
									hours: Number(("" + times[time]).split(":")[0]) + tzos,
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
									onClick={selectDate}
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