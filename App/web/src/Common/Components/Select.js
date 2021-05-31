import "./Input.css";
import { Field, useField } from "formik";

/**
 * A Formik select input component.
 */
 export const Select = ({ label, ...props }) => {
	const [field, meta] = useField(props);

	const options = [];
	options.push(<option key={label} value={""}>{"All"}</option>);

	for (const option of props.options) {
		options.push(<option key={option.id} value={option.id}>{option.label}</option>);
	}

	return (
		<div className="Input">
			<label htmlFor={props.id || props.name}>{label}:</label>
			<Field as="select" {...field} {...props} children={options} />
			{meta.touched && meta.error ? (
				<div className="error">{meta.error}</div>
			) : null}
		</div>
	);
};