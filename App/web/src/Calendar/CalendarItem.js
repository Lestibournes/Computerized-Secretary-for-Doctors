import { Link } from "react-router-dom";
import { useRoot } from "../Common/Root";

export function CalendarItem(props) {
	const root = useRoot();

	return (
		<Link className="calendarItem" to={root.get() + "/doctor/appointments/details/" + props.data.appointment}
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