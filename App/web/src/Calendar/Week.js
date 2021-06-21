import { useEffect } from "react";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { Time } from "../Common/Classes/Time";

/**
 * 
 * @param {{
 * events: {
 * 	color: string,
 * 	background: string,
 * 	date: SimpleDate,
 * 	start: Time,
 * 	end: Time,
 * 	label: string,
 * 	link: string
 * }[],
 * length: number,
 * start: SimpleDate,
 * segment: number
 * }} props
 */
export function Week({events, length, start, segment}) {
	useEffect(() => {
		if (events) {
			// Sort all the events so that they can be iterated over chronologically:
			events.sort(
				(a, b) => {
					if (a.date > b.date) return 1;
					if (a.date < b.date) return -1;

					if (a.start > b.start) return 1;
					if (a.start < b.start) return -1;

					return 0;
				}
			);
		}
	}, [events]);

	// Iterate over all of the events and sort them into days:
	let i = 0;
	let days = [];

	for (let current = start, day = 0; day < 7; current = current.getNextDay(), day++) {
		/**
		 * The events of the day:
		 */
		const today = [];

		for (; i < events.length; i++) {
			// If the event is of today, add it to the array:
			if (events[i].date.compare(current) === 0) schedule[day].push(events[i]);
			// If not then we are already through all of today's events, so break:
			else break;
		}

		// Add today to the display:
		days.push(<Day events={today} length={length} start={start} segment={segment} />);
	}

	return days;
}