import { useField } from "formik";
import "./SelectList.css";

/**
 * Uses Formik to present a scrolling list version of an HTML select element.
 */
 export const SelectList = ({ label, options, selected, ...props}) => {
	// Make sure that if either id or name is not specified, that it will have the correct value:
	if (!props.id) {
		props.id = props.name;
	}
	else if (!props.name) {
		props.name = props.id;
	}

	const [field, meta] = useField(props);
	const error = meta.touched && meta.error ? "error" : null;
	
	// field.value = options[selected]; // The index of the currently selected option.

	return (
		<div className="SelectList">
			<div className="header">
				<div className="label"><label htmlFor={props.id}>{label}:</label></div>
				<input type="hidden" className={error} {...field} {...props} />
			</div>
			<div className="list">
				{options.map((option, index) => {
					return <div
						key={option}
						className={"item" + (selected === index ? " selected" : "")}
						onClick={() => props.onClick(index)}
						>
							{option}
						</div>
				})}
			</div>
			{/* This code here is commented out because it causes a bug: */}
				{/* {meta.touched && meta.error ? (
					<div className="error">{String(meta.error)}</div>
				) : null} */}
		</div>
	);
};