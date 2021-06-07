import "./AppointmentCalendarPage.css";

//Reactjs:
import { React, useEffect, useState } from 'react';
import { useAuth } from "../Common/Auth";
import { Time } from "../Common/Classes/Time";
import { Slot } from "../Common/Classes/Slot";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { CalendarWeek } from "./CalendarWeek";
import { Button } from '../Common/Components/Button';
import { Page } from '../Common/Components/Page';
import { server } from "../Common/server";
import { Popup } from "../Common/Components/Popup";
import { useParams } from "react-router";
import { Select } from "../Common/Components/Select";
import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { usePopups } from "../Common/Popups";

function debounce(fn, ms) {
  let timer
  return _ => {
    clearTimeout(timer)
    timer = setTimeout(_ => {
      timer = null
      fn.apply(this, arguments)
    }, ms)
  };
}

export function AppointmentCalendarPage() {
	const auth = useAuth();
	const popupManager = usePopups();

	const { clinic } = useParams();
	const [doctors, setDoctors] = useState([]);
	const [doctor, setDoctor] = useState(null);
	const [options, setOptions] = useState();
	const [date, setDate] = useState(new SimpleDate()); // Default date: today.
	const [appointments, setAppointments] = useState([[], [], [], [], [], [], []]);
	const [schedule, setSchedule] = useState();
	const [minimum, setMinimum] = useState(60);

	const [dimensions, setDimensions] = useState({ 
		height: window.innerHeight,
		width: window.innerWidth
	});

	useEffect(() => {
		const debouncedHandleResize = debounce(() => {
			if (document.getElementById("display")) {
				setDimensions({
					height: document.getElementById("display").clientHeight,
					width: document.getElementById("display").clientWidth
				})
			}
		}, 1000);

		window.addEventListener('resize', debouncedHandleResize)

		return () => window.removeEventListener('resize', debouncedHandleResize);
	});

	useEffect(() => {
		if (clinic) {
			server.clinics.getAllDoctors({clinic: clinic}).then(response => {
				setDoctors(response.data);

				const doctor_options = [];

				for (const doctor_data of response.data) {
					doctor_options.push({
						value: doctor_data.doctor.id,
						label: doctor_data.user.fullName
					})
				}

				setOptions(doctor_options);
			});
		}
	}, [clinic]);
	
	useEffect(() => {
		if (auth.user && doctor === null && !clinic) {
			// Check if the current user is a doctor, and if he is, fetch his doctor id/ref:
			server.users.get({user: auth.user.uid}).then(user => {
				if (user.data.doctor) {
					server.doctors.getData({id: user.data.doctor}).then(doctor_data => {
						setDoctor(doctor_data.data);
					})
				}
				else {
					setDoctor(false);
				}
			});
		}
	}, [auth.user, doctor, clinic]);

	useEffect(() => {
		if (doctor && date) {
			// Load all the appointment data for the current time range:
			const saturday = date.getSaturday();
			
			const appointment_promises = [];
			
			// Go day by day:
			for (let current = date.getSunday(), day = 0; current.compare(saturday) <= 0; current = current.getNextDay(), day++) {
				appointment_promises.push(
					server.appointments.getAll(
						{
							doctor: doctor.doctor.id,
							start: current.toObject(),
							end: current.getNextDay().toObject()
						}
					).then(results => {
						const day_promises = [];

						const today = {
							appointments: [],
							day: day
						};
						
						// Results holds all the appointments for 1 day.
						// For each appointment:
						for (const result of results.data) {
							day_promises.push(
								server.schedules.getTypes({clinic: result.appointment.clinic, doctor: result.appointment.doctor}).then(types_response => {
									return server.schedules.getType({clinic: result.appointment.clinic, doctor: result.appointment.doctor, type: result.appointment.type}).then(type_response => {
										let hue = 240; //result.appointment.duration % 360;
	
										if (types_response.data.success && type_response.data.success){
											let max = 0;
											for (const t of types_response.data.types) {
												if (t.name && t.duration > max) max = t.duration;
											}

											hue = (360 / max) * type_response.data.duration;
										}
	
										return {
											color: "white",
											background: "hsl(" + hue + ", 100%, 30%)",
											duration: result.appointment.duration,
											start: Time.fromObject(result.extra.time),
											id: result.appointment.id,
											name: result.patient.fullName,
										};
									})
								})
							)
						}
						
						// Once all the appointments for today have been loaded:
						return Promise.all(day_promises).then(appointments => {
							if (appointments) {
								today.appointments = appointments;
							}

							return today;
						})
					})
				);
			}

			Promise.all(appointment_promises).then(week => {
				week.sort((a, b) => {
					return a.day > b.day ? 1 : a.day < b.day ? -1 : 0;
				});

				setAppointments(week.map(day => day.appointments));
			});
			
			// Get the global schedule paramaters.
			// This is to sized and space the calendar.
			let start; //The earliest starting time.
			let end; //The latest ending time.
			let minimum; //The shortest minimum appointment length.

			const schedule_promises = [];

			for (const clinic of doctor.clinics) {
				schedule_promises.push(
					server.schedules.get({clinic: clinic.id, doctor: doctor.doctor.id}).then(schedule => {
						for (const day of schedule.data) {
							for (const shift of day) {
								const start_time = Time.fromObject(shift.start);
								const end_time = Time.fromObject(shift.end);
								
								if (!minimum || shift.min < minimum) minimum = shift.min;
								if (!start || start_time.compare(start) < 0) start = start_time;
								if (!end || end_time.compare(end) > 0) end = end_time;
							}
						}
					})
				);
			}

			Promise.all(schedule_promises).then(() => {
				if (start && end) setSchedule(new Slot(start, end));
				else setSchedule(false);
				// setMinimum(minimum);
			});
		}
		else {
			setSchedule(null);
		}
	}, [doctor, date]);

	if (schedule === false) {
		popupManager.add(
			<Popup key="WorkScheduleWarning" close={() => {window.history.back()}}>
				You need to create a work schedule before viewing your appointment calendar.
			</Popup>
		);
	}

	if (doctor === false) {
		popupManager.add(
			<Popup key="DoctorWarning" close={() => {window.history.back()}}>
				You need to be a doctor to view your work calendar.
			</Popup>
		);
	}

	let display;
	
		display = 
			<>
				{clinic && options ?
					<Formik
						initialValues={{
							doctor: doctor ? doctor : ""
						}}
						validationSchema={Yup.object({
						})}
						onSubmit={async (values, { setSubmitting }) => {
							setSubmitting(true);
							
							if (values.doctor) {
								for (const doc of doctors) {
									if (doc.doctor.id === values.doctor) {
										setDoctor(doc);
										break;
									}
								}
							}
							else {
								setDoctor(null);
							}
						}}
					>
						<Form>
							<div className="searchBar">
								<Select
									label="Doctor"
									name="doctor"
									default={{
										value: "",
										label: ""
									}}
									options={options}
								/>
								<div className="buttonBar">
									<Button type="submit" label="Select" />
								</div>
							</div>
						</Form>
					</Formik>
				: ""}
				{schedule ?
					<div className="Calendar" id="display">
						<div className="buttonBar">
						<Button action={() => {
								setDate(new SimpleDate());
								}} label="Today" />
							<Button action={() => {
								setDate(date.getPreviousWeek());
								}} label="<" />
							<Button action={() => {
								setDate(date.getNextWeek());
								}} label=">" />
							<h3>{date.monthname + " " + date.year}</h3>
						</div>
						<CalendarWeek
							date={date}
							appointments={appointments}
							schedule={schedule}
							minimum={minimum}
							width={dimensions.width}
							height={960}
						/>
					</div>
				: ""}
			</>;

	return (
		<Page title="Work Calendar">
			{display}
		</Page>
	);
}