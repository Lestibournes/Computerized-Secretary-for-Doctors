import './Calendar.css';
import { Time } from "../Common/Classes/Time";
import { CalendarDay } from './CalendarDay';
import { SimpleDate } from '../Common/Classes/SimpleDate';
import { Strings } from '../Common/Classes/strings';

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

export function CalendarWeek(props) {
	const time_label_width = 50;
	const day_width = (props.width - time_label_width) / 7;

	const day_start = props.schedule.start.hours * 60 + props.schedule.start.minutes;
	const day_end = props.schedule.end.hours * 60 + props.schedule.end.minutes;
	const slots = (day_end - day_start) / props.minimum;
	const unit = props.height / slots;
	const lines = [];
	let index = 0;

	for (let time = Time.fromObject(props.schedule.start); index < slots; index++, time = time.incrementMinutes(props.minimum)) {
		lines.push(
			<div
				key={"line " + time}
				className="calendarTimeLabel"
				style={{top: "calc(" + (unit * index) + "px - 0.5em)", height: props.minimum}}
			>
				{time.toString()}
			</div>
		);
	}

	const headers = [];
	
	/**
	 * @type {SimpleDate}
	 */
	let date = props.date.getSunday().getPreviousDay();
	const days = props.appointments.map((day, index) => {
		date = date.getNextDay();

		headers.push(
			<div key={"header " + date.dayabbreviation} className="calendarDayHeader" style={{
				width: day_width,
				left: (Strings.instance.direction === "ltr" ? day_width * index : ""),
				right: (Strings.instance.direction === "rtl" ? day_width * index : "")
				}}>
				<b>{date.dayabbreviation}</b>
				<br />
				<small>{date.day + "/" + (date.month + 1)}</small>
			</div>
		);

		return (<CalendarDay
			key={"day " + date.dayname}
			global={{
				start: props.schedule.start,
				end: props.schedule.end,
				minimum: props.minimum,
				width: day_width,
				height: props.height,
				day: index,
				offset: 50
			}}

			appointments={day}
		/>)
	});

	return (
		<div className="calendarWeek">
			<div className="calendarHeader">
				{headers}
			</div>
			<div className="calendarBody">
				<div className="calendarTimeLabel"
					style={{
						width: time_label_width,
						height: props.height,
						left: (Strings.instance.direction === "ltr" ? 0 : ""),
						right: (Strings.instance.direction === "rtl" ? 0 : "")
					}}
				>
					{lines}
				</div>
				{days}
			</div>
		</div>
	);
}