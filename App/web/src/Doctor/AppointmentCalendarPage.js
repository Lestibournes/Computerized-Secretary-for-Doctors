import "./AppointmentCalendarPage.css";

//Reactjs:
import { React, useEffect, useState } from 'react';
import { useAuth } from "../Common/Auth";
import { fn } from '../init';
import { Slot, Time, SimpleDate } from "../Common/classes";
import { CalendarWeek } from "../Common/Components/CalendarWeek";
import { Button } from '../Common/Components/Button';
import { Page } from '../Common/Components/Page';

const getDoctorData = fn.httpsCallable("doctors-getData");
const getSchedule = fn.httpsCallable("schedules-get");
const getAppointments = fn.httpsCallable("appointments-getAll");
const getUser = fn.httpsCallable("users-get");

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
	const [schedule, setSchedule] = useState(new Slot(new Time(8, 30), new Time(16, 30)));
	const [minimum, setMinimum] = useState(60);
	const [colors, setColors] = useState({
		"new patient": 120,
		"regular": 240,
		"follow up": 360
	});

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
		if (auth.user && !doctor) {
			// Check if the current user is a doctor, and if he is, fetch his doctor id/ref:
			getUser({user: auth.user.uid}).then(user => {
				if (user.data.doctor) {
					getDoctorData({id: user.data.doctor}).then(doctor_data => {
						setDoctor(doctor_data.data);
					})
				}
			});
		}
	}, [auth.user, doctor]);

	useEffect(() => {
		if (doctor && date) {
			// Load all the appointment data for the current time range:
			const saturday = date.getSaturday();
			
			const appointment_promises = [];
			
			for (let current = date.getSunday(); current.compare(saturday) <= 0; current = current.getNextDay()) {
				appointment_promises.push(
					getAppointments(
						{
							doctor: doctor.doctor.id,
							start: current.toObject(),
							end: current.getNextDay().toObject()
						}
					).then(results => {
						const today = {
							appointments: [],
							day: new SimpleDate(null, null, null)
						};
						
						for (const result of results.data) {
							today.day = SimpleDate.fromObject(result.extra.date);
							
							today.appointments.push({
								color: "white",
								background: "hsl(" + colors[result.appointment.type] + ", 100%, 30%)",
								duration: result.appointment.duration,
								start: Time.fromObject(result.extra.time),
								id: result.appointment.id,
								name: result.patient.fullName
							});
						}
						
						return today;
					})
				);
			}

			Promise.all(appointment_promises).then(week => {
				week.sort((a, b) => {
					return -a.day.compare(b);
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
					getSchedule({clinic: clinic.id, doctor: doctor.doctor.id}).then(schedule => {
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
				setSchedule(new Slot(start, end));
				// setMinimum(minimum);
			});
		}
	}, [doctor, date, colors]);

	return (
		<Page title="Work Calendar">
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
		</Page>
	);
}