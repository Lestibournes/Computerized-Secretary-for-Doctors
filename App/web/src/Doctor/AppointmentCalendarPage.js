import "./AppointmentCalendarPage.css";

//Reactjs:
import { React, useEffect, useState } from 'react';
import { useAuth } from "../Common/Auth";
import { Slot, Time, SimpleDate } from "../Common/classes";
import { CalendarWeek } from "../Common/Components/CalendarWeek";
import { Button } from '../Common/Components/Button';
import { Page } from '../Common/Components/Page';
import { server } from "../Common/server";
import { Popup } from "../Common/Components/Popup";

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

	const [doctor, setDoctor] = useState(null);
	const [date, setDate] = useState(new SimpleDate());
	const [appointments, setAppointments] = useState([[], [], [], [], [], [], []]);
	const [schedule, setSchedule] = useState();
	const [minimum, setMinimum] = useState(60);
	const [popupManager, setPopupManager] = useState({});

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
		if (auth.user && doctor === null) {
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
	}, [auth.user, doctor]);

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
	}, [doctor, date]);

	if (schedule === false) {
		popupManager.add(
			<Popup close={() => {window.history.back()}}>
				You need to create a work schedule before viewing your appointment calendar.
			</Popup>
		);
	}

	if (doctor === false) {
		popupManager.add(
			<Popup close={() => {window.history.back()}}>
				You need to be a doctor to view your work calendar.
			</Popup>
		);
	}

	let display;
	
	if (schedule) {
		display = 
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
			</div>;
	}

	return (
		<Page title="Work Calendar" popupManager={popupManager}>
			{display}
		</Page>
	);
}