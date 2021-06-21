import "./AppointmentCalendarPage.css";

//Reactjs:
import { React, useEffect, useState } from 'react';
import { useAuth } from "../Common/Auth";
import { Time } from "../Common/Classes/Time";
import { Slot } from "../Common/Classes/Slot";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { CalendarWeek } from "./CalendarWeek";
import { Button } from '../Common/Components/Button';
import { Popup } from "../Common/Components/Popup";
import { useParams } from "react-router";
import { Select } from "../Common/Components/Select";
import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { usePopups } from "../Common/Popups";
import { Header } from "../Common/Components/Header";
import { db } from "../init";
import { Loading } from "../Common/Components/Loading";

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

export function ClinicCalendarPage() {
	const auth = useAuth();
	const popups = usePopups();

	const { clinic } = useParams();
	const [doctors, setDoctors] = useState([]);
	const [clinics, setClinics] = useState([]);
	const [doctor, setDoctor] = useState(null);
	const [options, setOptions] = useState();
	const [date, setDate] = useState(new SimpleDate()); // Default date: today.
	const [appointments, setAppointments] = useState([[], [], [], [], [], [], []]);
	const [schedule, setSchedule] = useState(null);
	const [minimum, setMinimum] = useState(60);
	const [types, setTypes] = useState(new Map());
	const [max, setMax] = useState(0); //Longest appointment. Used for automatically color-coding appointment types.

	// The dimentions of the display area. I really should have used CSS for this:
	/**
	 * @todo use CSS for the layout of the calendar.
	 */
	const [dimensions, setDimensions] = useState({ 
		height: window.innerHeight,
		width: window.innerWidth
	});

	// Resize the display too often:
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

	// If it's a clinic-wide appointment calendar, fetch the list of doctors in the clinic:
	/**
	 * @todo move all the data-fetching outside of the calendar component. The calendar should be a widget that displays events that are provided to it, nothing more.
	 */
	useEffect(() => {
		if (clinic) {
			db.collection("clinics").doc(clinic).collection("doctors").get().then(doctor_snaps => {
				const promises = [];

				for (const doctor_snap of doctor_snaps.docs) {
					promises.push(
						db.collection("users").doc(doctor_snap.id).get().then(user_snap => {
							const data = user_snap.data();
							data.id = user_snap.id;
							return data;
						})
					)
				}

				Promise.all(promises).then(doctors => {
					setDoctors(doctors);

					const doctor_options = [];
		
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

	// Once a doctor and clinic combination is selected (for clinic calendars), load the appointment types:
	useEffect(() => {
		if (doctor && clinic) {
			db.collection("clinics").doc(clinic).collection("doctors").doc(doctor.id).collection("types").get()
				.then(type_snaps => {
					const types = new Map();
					let max = 0;
		
					for (const type of type_snaps.docs) {
						if (type.data().name) {
							types.set(type.data().name, type.data().duration);
							if (type.data().duration > max) max = type.data().duration;
						}
					}

					setTypes(types);
					setMax(max);
				})
				.catch(reason => popups.error(reason))
		}
	}, [doctor, clinic]);

	// When a doctor and date are selected.
	// Won't this just load all appointments for the given doctor across all clinics?
	// What about per-clinic appointments?
	useEffect(() => {
		if (clinic && doctor && date) {
			// Load all the appointment data for the current time range:
			const saturday = date.getSaturday();
			
			const appointment_promises = [];
			
			// Fetch the appointments day by day:
			for (let current = date.getSunday(), day = 0; current.compare(saturday) <= 0; current = current.getNextDay(), day++) {
				appointment_promises.push(
					db.collection("clinics").doc(clinic).collection("appointments")
						.where("doctor", "==", doctor.id)
						.where("start", "==", current.toDate())
						.where("end", "==", current.getNextDay().toDate())
						.get()
					.then(appointment_snaps => {
						const today = {
							appointments: [],
							day: day
						};

						const day_promises = [];

						// Get the appointment data this day:
						for (const appointment of appointment_snaps.docs) {
							day_promises.push(
								db.collection("users").doc(appointment.data().patient).get()
								.then(patient_snap => {
									const hue = (360 / max) * types.get(appointment.data().type);
									
									today.appointments.push({
										color: "white",
										background: "hsl(" + hue + ", 100%, 30%)",
										duration: appointment.data().duration,
										start: new Time(appointment.data().start),
										id: appointment.id,
										name: patient_snap.data().fullName,
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

	// Get the schedule paramaters.
	// This is to sized and space the calendar.
	useEffect(() => {
		if (clinic && doctor && date) {
			db.collection("clinics").doc(clinic).collection("doctors").doc(doctor.id).collection("shifts").get()
			.then (shift_snaps => {
				let start; //The earliest starting time.
				let end; //The latest ending time.

				for (const shift_snap of shift_snaps.docs) {
					const start_time = Time.fromDate(shift_snap.data().start.toDate());
					const end_time = Time.fromDate(shift_snap.data().end.toDate());

					if (!start || start_time.compare(start) < 0) start = start_time;
					if (!end || end_time.compare(end) > 0) end = end_time;
				}

				if (start && end) setSchedule(new Slot(start, end));
				else setSchedule(false);
			})
			.catch(reason => popups.error(reason.message));
		}
	}, [clinic, doctor, date]);

	useEffect(() => {
		if (schedule === false) {
			const close = () => popups.remove(popup);
			const popup =
				<Popup key="WorkScheduleWarning" close={close /*() => {window.history.back()}*/}>
					The selected doctor does not have a work schedule.
				</Popup>;
			popups.add(popup);
		}
	}, [schedule]);

	useEffect(() => {
		
	}, [clinic, doctor]);

	let display = <Loading />;
	
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
						// If the user has selected a doctor, find the doctor data for that doctor and set it:
						if (values.doctor) {
							for (const doc of doctors) {
								if (doc.id === values.doctor) {
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
		<div className="Page">
			<Header />
			<h1>Work Calendar</h1>
			{display}
		</div>
	);
}