import { Link } from "react-router-dom";

export function CalendarItem(props) {
	return (
		<Link className="calendarItem" to={"/specific/doctor/appointments/details/" + props.data.appointment}
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