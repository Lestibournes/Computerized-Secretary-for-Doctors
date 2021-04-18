import "./Input.css";
import { useField } from "formik";

/**
 * A Formik select input component.
 */
 export const Select = ({ label, ...props }) => {
	const [field, meta] = useField(props);

	return (
		<div className="Input">
			<label htmlFor={props.id || props.name}>{label}:</label>
			<select {...field} {...props} value>
				<option key={label} disabled value>Select an Option</option>
				{
					props.options.map(option => {
						return <option key={option.id} value={option.id}>{option.label}</option>
					})
				}
			</select>
			{meta.touched && meta.error ? (
				<div className="error">{meta.error}</div>
			) : null}
		</div>
	);
};