import { Field, useField, useFormikContext } from "formik";
import { useEffect } from "react";
import { Button } from "./Button";
import "./SelectDate.css";

/**
 * Uses Formik to present a date selector.
 * @todo Switch to using the Time and SimpleDate objects.
 */
 export const SelectDate = ({ selected, ...props}) => {
	// Make sure that if either id or name is not specified, that it will have the correct value:
	if (!props.id) {
		props.id = props.name;
	}
	else if (!props.name) {
		props.name = props.id;
	}

	const [field, meta] = useField(props);
	const error = meta.touched && meta.error ? "error" : null;

	const {
		setFieldValue
	} = useFormikContext();
	
	useEffect(() => {
		if (props.name && selected && setFieldValue) {
			setFieldValue(props.name, selected);
		}
	}, [props.name, selected, setFieldValue]);
	
	/**
	 * The next month relative to the currently selected month.
	 */
	const next_month = selected.getNextMonth();
	
	/**
	 * The first day of the week for the currently displayed month.
	 */
	const startday = new Date(selected.year, selected.month, 1).getDay();
	/**
	 * The number of days in the current month.
	 */
	const current_length = (new Date(next_month.year, next_month.month, 0)).getDate();
	
	/**
	 * The previous month.
	 */
	const previous_month = selected.getPreviousMonth();
	/**
	 * The number of days in the previous month.
	 */
	const previous_length = (new Date(selected.year, selected.month, 0)).getDate();

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
				month: selected.month,
				year: selected.year
			};
			
			className = (selected.day === date.day ? "selected" : "")
		}

		// Create the component and add it to the array to be displayed:
		days.push(
			<div
				key={i}
				className={"item " + className}
				onClick={() => props.onClick(date)}
			>
				{date.day}
			</div>
		)
	}

	return (
		<div className="SelectDate">
			<div className="header">
				<Button
					action={() => props.onClick(selected.getPreviousMonth())}
					label="<"
				/>
				<div className="label">{selected.monthname + " " + selected.year}</div>
				<Field type="hidden" className={error} {...field} {...props} />
				<Button
					action={() => props.onClick(selected.getNextMonth())}
					label=">"
				/>
			</div>
			<div className="body">
				{days}
			</div>
			{meta.touched && meta.error ?
				<div className="error">{String(meta.error)}</div>
			: ""}
		</div>
	);
};