import { Time } from "../classes";
import { CalendarItem } from "./CalendarItem";

export function CalendarDay(props) {
	const day_start = props.global.start.hours * 60 + props.global.start.minutes;
	const day_end = props.global.end.hours * 60 + props.global.end.minutes;
	const slots = (day_end - day_start) / props.global.minimum;
	const unit = props.global.height / slots;
	const lines = [];
	let index = 0;

	for (let time = new Time(props.global.start.hours, props.global.start.minutes); index < slots; index++, time = time.incrementMinutes(props.global.minimum)) {
		lines.push(<div
			key={"day " + props.index + " " + time}
			className="calendarLine"
			style={{top: unit * index, width: props.global.width}}
		></div>);
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
						key={"appointment " + appointment.id}
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