import { Link } from "react-router-dom";
import {Time, SimpleDate } from "./classes";
import './CalendarComponents.css';

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

export function CalendarItem(props) {
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

export function CalendarDay(props) {
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

export function CalendarWeek(props) {
	const day_start = props.schedule.start.hours * 60 + props.schedule.start.minutes;
	const day_end = props.schedule.end.hours * 60 + props.schedule.end.minutes;
	const unit = props.height / (((day_end - day_start) / props.minimum) + 1);
	const lines = [];
	let index = 0;

	for (let time = new Time(props.schedule.start.hours, props.schedule.start.minutes); index < props.height / unit; index++, time = time.incrementMinutes(props.minimum)) {
		lines.push(<div className="calendarTimeLabel" style={{top: "calc(" + (unit * index) + "px - 0.5em)", height: props.minimum}}>{time.toString()}</div>);
	}

	const sunday = new Date(props.date.getUTCFullYear(), props.date.getUTCMonth(), props.date.getDate() - props.date.getDay());
	const headers = [];
	
	const days = props.appointments.map((day, index) => {
		const date = new Date(props.date.getUTCFullYear(), props.date.getUTCMonth(), props.date.getDate() - props.date.getDay() + 1 + index);
		const simpleDate = new SimpleDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

		headers.push(
			<div className="calendarDayHeader">
				<b>{simpleDate.dayname}</b>
				<br />
				<small>{simpleDate.toString()}</small>
			</div>
		);

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
		<div className="calendarHeader">
			{headers}
		</div>
		<div className="calendarBody">
			<div className="calendarTimeLabel"
				style={{
					width: 50,
					height: props.height,
					left: 0,
				}}
			>
				{lines}
			</div>
			{days}
		</div>
	</div>);
}