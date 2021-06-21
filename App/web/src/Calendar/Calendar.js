export const DAY = "day", WEEK = "week";

export function Calendar({events, length, view, start, segment}) {
	// Should show time labels?
	let display = 
		<div className="calendar">
			<Times length={length} segment={segment} />
		</div>
	if (view === DAY) return <Day events={events} length={length} start={start} segment={segment} />
	if (view === WEEK) return <Calendar events={events} length={length} start={start} segment={segment} />
}