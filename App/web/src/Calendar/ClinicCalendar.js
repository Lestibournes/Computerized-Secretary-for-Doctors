import "./AppointmentCalendarPage.css";

//Reactjs:
import { React, useEffect, useState } from 'react';
import { useAuth } from "../Common/Auth";
import { Time } from "../Common/Classes/Time";
import { Slot } from "../Common/Classes/Slot";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { Button } from '../Common/Components/Button';
import { Popup } from "../Common/Components/Popup";
import { useParams } from "react-router";
import { Select } from "../Common/Components/Select";
import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { usePopups } from "../Common/Popups";
import { Header } from "../Common/Components/Header";
import { db } from "../init";
import { useRoot } from "../Common/Root";
import { Loading } from "../Common/Components/Loading";

export function AppointmentCalendarPage() {
	const auth = useAuth();
	const popups = usePopups();
	const root = useRoot();

	const { clinic } = useParams();
	const [doctors, setDoctors] = useState([]);
	const [doctor, setDoctor] = useState(null);
	const [options, setOptions] = useState();
	const [date, setDate] = useState(new SimpleDate().getSunday()); // Default date: this week's Sunday.
	const [appointments, setAppointments] = useState([[], [], [], [], [], [], []]);
	const [schedule, setSchedule] = useState();
	const [types, setTypes] = useState(new Map());
	const [max, setMax] = useState(0); //Longest appointment. Used for automatically color-coding appointment types.

	const [view, setView] = useState("week"); // Whether it's 1 day, (3 days?), 1 week, or 1 month view.
	const [segment, setSegment] = useState(60); // The spacing of the time markers, in minutes. For example, write the time on the calendar every 15 minutes, 30 minutes, 60 minutes.

	// If it's a clinic-wide appointment calendar, fetch the list of doctors in the clinic:
	/**
	 * @todo move all the data-fetching outside of the calendar component. The calendar should be a widget that displays events that are provided to it, nothing more.
	 */
	useEffect(() => {
		if (clinic) {
			db.collection("clinics").doc(clinic).collection("doctors").get().then(doctor_snaps => {
				const promises = [];

				// Fetch all of the doctor's user data in parallel:
				for (const doctor_snap of doctor_snaps.docs) {
					promises.push(
						db.collection("users").doc(doctor_snap.id).get().then(user_snap => {
							const data = user_snap.data();
							data.id = user_snap.id;
							return data;
						})
					)
				}

				// Once all the data is fetched, save it:
				Promise.all(promises).then(doctors => {
					setDoctors(doctors);

					const doctor_options = [];
		
					// And generate the list for the select element:
					for (const doctor of doctors) {
						doctor_options.push({
							value: doctor.id,
							label: doctor.fullName
						})
					}
		
					setOptions(doctor_options);
				});
			});
		}
	}, [clinic]);

	// Once a doctor and clinic combination is selected, load the appointment types:
	useEffect(() => {
		if (doctor && clinic) {
			db.collection("clinics").doc(clinic).collection("doctors").doc(doctor.id).collection("types").get()
				.then(type_snaps => {
					const types = new Map();
					let max = 0;
		
					for (const type of type_snaps.docs) {
						if (type.data().name) {
							types.set(type.data().name, type.data().duration);
							if (type.data().duration > max) max = type.data().duration; //The max duration is used for now to automatically color-code appointments by duration.
						}
					}

					setTypes(types);
					setMax(max);
				})
				.catch(reason => popups.error(reason))
		}
	}, [doctor, clinic]);

	// When a doctor and date are selected.
	// Load all the appointment data for the current time range:
	/**
	 * @todo make this work for other time ranges than 1 week, like 1 day, 3 days, or 1 month.
	 */
	useEffect(() => {
		if (clinic && doctor && date) {
			const saturday = date.getSaturday();
			
			const appointment_promises = [];
			
			// Fetch the appointments day by day:
			for (let current = date.getSunday(); current.compare(saturday) <= 0; current = current.getNextDay()) {
				appointment_promises.push(
					db.collection("clinics").doc(clinic).collection("appointments")
					.where("doctor", "==", doctor.id)
					.where("start", "==", current.toDate().getTime())
					.where("end", "==", current.getNextDay().toDate().getTime())
					.get()
					.then(appointment_snaps => {
						const today = {
							appointments: [],
							day: current.weekday
						};

						const day_promises = [];

						// Get the appointment data this day:
						for (const appointment of appointment_snaps.docs) {
							day_promises.push(
								db.collection("users").doc(appointment.data().patient).get()
								.then(patient_snap => {
									const hue = (360 / max) * types.get(appointment.data().type);
									
									today.appointments.push({
										// Styling:
										color: "white",
										background: "hsl(" + hue + ", 100%, 30%)",

										// Geometry:
										date: new SimpleDate(appointment.data().start.toDate()),
										start: Time.fromDate(appointment.data().start.toDate()),
										end: Time.fromDate(appointment.data().end.toDate()),
										
										// Data:
										label: patient_snap.data().fullName,
										link: root.get() + "/clinic/appointments/details/" + appointment.id
									});
								})
								.catch(reason => popups.error(reason))
							);
						}
						
						// Once all the appointments for today have been loaded:
						return Promise.all(day_promises).then(appointments => {
							if (appointments) today.appointments = appointments;
							return today;
						});
					})
					.catch(reason => popups.error(reason))
				);
			}

			Promise.all(appointment_promises).then(week => {
				week.sort((a, b) => {
					return a.day > b.day ? 1 : a.day < b.day ? -1 : 0;
				});

				const calendar = [];

				for (const day of week) {
					if (day) calendar.push(day.appointments);
					else calendar.push([]);
				}
				
				setAppointments(calendar);
			});
		}
	}, [clinic, doctor, date]);


	useEffect(() => {
		if (clinic && doctor && date) {
			// Get the global schedule paramaters.
			// This is to sized and space the calendar.
			let start; //The earliest starting time.
			let end; //The latest ending time.

			const schedule_promises = [];

			for (const clinic of clinics) {
				if (clinic?.id) {
					schedule_promises.push(
						db.collection("clinics").doc(clinic.id).collection("doctors").doc(doctor.id).collection("shifts").get()
						.then(shift_snaps => {
							for (const shift_snap of shift_snaps.docs) {
								const start_time = Time.fromObject(shift_snap.data().start);
								const end_time = Time.fromObject(shift_snap.data().end);
								
								if (!start || start_time.compare(start) < 0) start = start_time;
								if (!end || end_time.compare(end) > 0) end = end_time;
							}
						})
						.catch(reason => popups.error(reason))
					);
				}
			}

			Promise.all(schedule_promises).then(() => {
				if (start && end) setSchedule(new Slot(start, end));
				else setSchedule(false);
			});
		}
	}, [clinic, doctor, date]);

	let display = <Loading />;

	if (appointments && schedule && view && start && segment) {
		display = <Calendar events={appointments} length={schedule} view={view} start={date} segment={segment} />
	}
	
	return (
		<div className="Page">
			<Header />
			<header>
				<h1>Clinic Calendar</h1>
			</header>
			<main>
				{display}
			</main>
		</div>
	);
}