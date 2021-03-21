//Reactjs:
import { React, useEffect, useState } from 'react';
import { MainHeader, useAuth } from "./CommonComponents";
import { Link, Redirect } from 'react-router-dom';
import { db, fn, storage } from './init';
import { SimpleDate, Slot, Time } from "./classes";

const getDoctor = fn.httpsCallable("getDoctor");

/*
The plan:
Calendar item: receives its appointment details, color, height, width and location on the y axis from parent. Displays itself as a box.

Calendar day: receives a list of appointments that take place on that date, as well as the starting and ending time, the height and width of the display area it is given,
and the size of minimal appointment duration from its parent.
It will then create a calendar item for each appointment and give it a size that is proportional to the appointment duration as follows:
Divide the height of the day's display area into units based on the starting time and ending time of the day and the minimum appointment duration:
number_of_slots = (start_time - end_time) / minimum_duration;
height_of_slot = day_height / number_of_slots;
Then the pixel height of each item:
height_of_item = (duration * height_of_slot) / minimum_duration

Calendar week:
Receives the week (can be week number or the date of Sunday).
Gets all the appintments for that week.
Gets the schedule for the doctor and finds the earliest starting time and latest starting time.
For each day it will give it the appointments of the day as well as the display area and starting and ending time, which are the same for all days.
It will display all the days in a row. The row will start with a marking of the times. Above the rows it will display the days of the week along with their dates.
*/

function CalendarItem(props) {
	return (
		<Link className="calendarItem" to={"details/" + props.data.appointment}
			style={{
				color: props.display.color,
				backgroundColor: props.display.background,
				height: props.display.height,
				width: props.display.width,
				top: props.display.top
			}}
		>
			{(props.data.start.hours < 10 ? "0" : "") + props.data.start.hours + ":" + (props.data.start.minutes < 10 ? "0" : "") + props.data.start.minutes} <b>{props.data.name}</b>
		</Link>
	)
}

function CalendarDay(props) {
	const day_start = props.global.start.hours * 60 + props.global.start.minutes;
	const day_end = props.global.end.hours * 60 + props.global.end.minutes;
	const unit = props.global.height / (((day_end - day_start) / props.global.minimum) + 1);
	const lines = [];
	let index = 0;

	for (let time = new Time(props.global.start.hours, props.global.start.minutes); index < props.global.height / unit; index++, time = time.incrementMinutes(props.global.minimum)) {
		lines.push(<div className="calendarLine" style={{top: unit * index, width: props.global.width}}></div>);
	}

	return (
		<div className="calendarDay"
			style={{
				width: props.global.width,
				height: props.global.height,
				left: props.global.day * props.global.width + props.global.left
			}}
		>
			{lines}
			{
				props.appointments.map(appointment => {
					const app_start = appointment.start.hours * 60 + appointment.start.minutes;
					
					return (
					<CalendarItem
						display={{
							color: appointment.color,
							background: appointment.background,
							height: ((appointment.duration * unit) / props.global.minimum) + "px",
							width: props.global.width + "px",
							top: (((app_start - day_start) * unit) / props.global.minimum) + "px"
						}}
						data={{
							appointment: appointment.id,
							name: appointment.name,
							start: appointment.start
						}}
					/>
				)})
			}
		</div>
	);
}

function CalendarWeek(props) {
	const day_start = props.schedule.start.hours * 60 + props.schedule.start.minutes;
	const day_end = props.schedule.end.hours * 60 + props.schedule.end.minutes;
	const unit = props.height / (((day_end - day_start) / props.minimum) + 1);
	const lines = [];
	let index = 0;

	for (let time = new Time(props.schedule.start.hours, props.schedule.start.minutes); index < props.height / unit; index++, time = time.incrementMinutes(props.minimum)) {
		lines.push(<div className="calendarTimeLabel" style={{top: "calc(" + (unit * index) + "px - 0.5em)", height: props.minimum}}>{time.toString()}</div>);
	}

	const days = props.appointments.map((day, index) => {
		return (<CalendarDay
			global={{
				start: props.schedule.start,
				end: props.schedule.end,
				minimum: props.minimum,
				width: props.width,
				height: props.height,
				day: index,
				left: 50
			}}

			appointments={day}
		/>)
	});

	return (<div className="calendarWeek">
		<div className="calendarDay"
			style={{
				width: 50,
				height: props.height,
				left: 0
			}}
		>
			{lines}
		</div>
		{days}
	</div>);
}

export function AppointmentCalendarPage(props) {
	const auth = useAuth();
	const [doctor, setDoctor] = useState(null);
	const [date, setDate] = useState(new Date());
	const [appointments, setAppointments] = useState([[], [], [], [], [], [], []]);
	const [schedule, setSchedule] = useState(new Slot(new Time(8, 30), new Time(16, 30)));
	const [minimum, setMinimum] = useState(60);
	const [colors, setColors] = useState({
		"new patient": 120,
		"regular": 240,
		"follow up": 360
	});

	async function getAppointments() {
		const sunday = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getDate() - date.getDay());
		const saturday = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getDate() + (6 - date.getDay()));
		const end = new Date(saturday.getUTCFullYear(), saturday.getUTCMonth(), saturday.getUTCDate() + 2);

		let current = sunday;
		let next = new Date(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + 2);

		const appointments = [];

		while (current < end) {
			const today = [];

			await db.collection("doctors").doc(doctor.id).collection("appointments").orderBy("start").startAt(current).endAt(next).get().then(snaps => {

				snaps.forEach(snap => {
					let start = new Date();
					start = snap.data().start.toDate();
					const start_time = new Time(start.getUTCHours(), start.getUTCMinutes()).incrementMinutes(-start.getTimezoneOffset());

					let name = snap.data().patient;
					
					today.push({
						color: "white",
						background: "hsl(" + colors[snap.data().type] + ", 100%, 30%)",
						duration: snap.data().duration,
						start: start_time,
						id: snap.id,
						name: name
					});
				})
				
			});
			
			for (let i = 0; i < today.length; i++) {
				await db.collection("users").doc(today[i].name).get().then(user => {
					today[i].name = user.data().firstName + " " + user.data().lastName;
				});
			}
			
			appointments.push(today);
			
			current = next;
			next = new Date(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + 2)
		}

		setAppointments(appointments);
	}

	async function getSchedule() {
		let start;
		let end;
		let minimum;

		await db.collection("slots").where("doctor", "==", doctor.id).get().then(snaps => {
			snaps.forEach(snap => {
				const types = snap.data().types;
				for (let type of Object.keys(types)) {
					if (!minimum || types[type] < minimum) {
						minimum = types[type];
					}
				}

				const week = snap.data().weekly;
				for (let day of Object.keys(week)) {
					for (let i = 0; i < week[day].length; i++) {
						let start_date = new Date();
						start_date = week[day][i].start.toDate();

						let start_time = new Time(start_date.getUTCHours(), start_date.getUTCMinutes()).incrementMinutes(-start_date.getTimezoneOffset());

						if (!start || start_time.compareTime(start) < 0) {
							start = start_time;
						}

						let end_date = new Date();
						end_date = week[day][i].end.toDate();

						let end_time = new Time(end_date.getUTCHours(), end_date.getUTCMinutes()).incrementMinutes(-end_date.getTimezoneOffset());
						
						if (!end || end_time.compareTime(end) > 0) {
							end = end_time;
						}
					}
				}
			});
		});

		setSchedule(new Slot(start, end));
		// setMinimum(minimum);
	}
		
		useEffect(() => {
		if (auth.user) {
			if (!doctor) {
				// Check if the current user is a doctor, and if he is, fetch his doctor id/ref:
				const userRef = db.collection("users").doc(auth.user.uid);
				db.collection("doctors").where("user", "==", userRef).get().then(snaps => {
					snaps.forEach(snap => {
						setDoctor(snap);
						return;
					});
				});
			}
			else {
				// Fetch the current doctor's appointments:
				getAppointments();
				getSchedule();
			}
		}
	}, [doctor]);

	return (
		<div className="page">
			{!auth.user ? <Redirect to="/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="content">

				<div className="appointment_picker">
					<h1>Work Calendar</h1>
					<CalendarWeek
						date={date}
						appointments={appointments}
						schedule={schedule}
						minimum={minimum}
						width={200}
						height={960}
				/>
				</div>
			</div>
		</div>
	);
}