import { useField } from "formik";
import { Button } from "./Button";
import "./SelectDate.css";

/**
 * Uses Formik to present a date selector.
 * @todo Switch to using the Time and SimpleDate objects.
 */
 export const SelectDate = ({ day, month, year, ...props}) => {
	// Make sure that if either id or name is not specified, that it will have the correct value:
	if (!props.id) {
		props.id = props.name;
	}
	else if (!props.name) {
		props.name = props.id;
	}

	const [field, meta] = useField(props);
	const error = meta.touched && meta.error ? "error" : null;
	const month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	// Helper functions for changing the month being displayed:
	const getNextMonth = (month, year) => {
		if (month === 11) {
			return {
				month: 0,
				year: year + 1
			}
		}
		else {
			return {
				month: month + 1,
				year: year
			}
		}
	}

	const getPreviousMonth = (month, year) => {
		if (month === 0) {
			return {
				month: 11,
				year: year - 1
			}
		}
		else {
			return {
				month: month - 1,
				year: year
			}
		}
	}

	// Correcting the month and year that are received from the props in case the value of the month is wrong:
	if (month < 0) {
		month += 12;
		year--;
	}
	else if (month > 11) {
		month %= 11;
		year++;
	}

	// field.value = new Date(year, month, day);
	
	/**
	 * The first day of the week for the currently displayed month.
	 */
	const startday = new Date(year, month, 1).getDay();
	/**
	 * The number of days in the current month.
	 */
	const current_length = (new Date(year, month + 1, 0)).getDate();
	
	/**
	 * The previous month.
	 */
	const previous_month = getPreviousMonth(month, year);
	/**
	 * The number of days in the previous month.
	 */
	const previous_length = (new Date(previous_month.year, previous_month.month, 0)).getDate();

	/**
	 * The next month relative to the currently selected month.
	 */
	const next_month = getNextMonth(month, year);
	
	/**
	 * Holds all the components representing the days that will appear on the calendar.
	 * It should hold 42 components, which include the ending of the previous month,
	 * all of the current month, and the beginning of next month.
	 * @todo If the month starts on a Sunday, add the last 7 days of the previous month
	 * so that the current month will start on the 2nd Sunday that is being displayed.
	 */
	const days = [];

	for (let i = 1; i <= 42; i++) {
		let date;
		let className;

		if (i <= startday) {
			// Set the values and display style for the last days of the previous month before adding the current month:
			date = {
				day: i + previous_length - startday,
				month: previous_month.month,
				year: previous_month.year
			};
			className = "faded";
		}
		else if (i > current_length + startday) {
			// Set the values and display style for the first days of the next month after adding the current month:
			date = {
				day: i - (current_length + startday),
				month: next_month.month,
				year: next_month.year
			};

			className = "faded";
		}
		else {
			// Set the values and display style for the days of the current month:
			date = {
				day: i - startday,
				month: month,
				year: year
			};
			
			className = (day === date.day ? "selected" : "")
		}

		// Create the component and add it to the array to be displayed:
		days.push(<div
			key={i}
			className={"item " + className}
			onClick={() => props.onClick(date)}
			>
				{date.day}
			</div>)
	}

	return (
		<div className="SelectDate">
			<div className="header">
				<Button action={
					() => {
						let date = getPreviousMonth(month, year);
						// date.day = null;
						props.onClick(date);
					}
					}
					label="<" />
				<div className="label">{month_names[month] + " " + year}</div>
				<input type="hidden" className={error} {...field} {...props} />
				<Button action={
					() => {
						let date = getNextMonth(month, year);
						// date.day = null;
						props.onClick(date);
					}
					}
					label=">" />
			</div>
			<div className="body">
				{days}
			</div>
			{/* This code here is commented out because it causes a bug: */}
				{/* {meta.touched && meta.error ? (
					<div className="error">{String(meta.error)}</div>
				) : null} */}
		</div>
	);
};