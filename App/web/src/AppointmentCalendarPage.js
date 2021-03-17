//Reactjs:
import { React, useEffect, useState } from 'react';
import { MainHeader, useAuth } from "./CommonComponents";
import { Link, Redirect } from 'react-router-dom';
import { db, fn, storage } from './init';
import { Time } from "./classes";

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
			{props.data.start} <b>{props.data.name}</b>
		</Link>
	)
}

function CalendarDay(props) {
	const appintments = [];
	const items = [];

	appintments.forEach(appointment => {
		items.push(<CalendarItem
			display={{
				color: appointment.color,
				background: appointment.color,
				height: ((appointment.duration * props.unit) / props.minimum) + "px",
				width: props.width + "px",
				top: ((((appointment.start.hours - props.start.hours) * 60) + appintments.start.minutes) * props.unit) + "px"
			}}
			data={{
				appointment: appointment.id,
				name: appointment.name,
				start: appointment.start
			}}
		/>);
	});
}

export function AppointmentCalendarPage(props) {
	const auth = useAuth();

	return (
		<div className="page">
			{!auth.user ? <Redirect to="/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="content">

				<div className="appointment_picker">
					<h1>Work Calendar</h1>
					<CalendarItem
						display={{
							color: "white",
							background: "red",
							height: "90px",
							width: "180px",
							top: "90px"
						}}
						data={{
							appointment: "some id string",
							// patient: "some id string",
							name: "Donald Trump",
							start: "12:00",
							// end: "12:45",
							// duration: 45,
							// type: "New Patient"
						}}
					/>
				</div>
			</div>
		</div>
	);
}