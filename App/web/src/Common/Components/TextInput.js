import './Input.css';
import { Field, useField } from 'formik';

/**
 * A Formik text input component.
 */
 export const TextInput = ({ label, ...props }) => {
	 // Make sure that if either id or name is not specified, that it will have the correct value:
	 if (!props.id) {
		 props.id = props.name;
	 }
	 else if (!props.name) {
		 props.name = props.id;
	 }

	// useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
	// which we can spread on <input> and alse replace ErrorMessage entirely.
	const [field, meta] = useField(props);
	const error = meta.touched && meta.error ? "error" : null; // Whether or not an error message should be displayed.
	
	return (
		<div className="Input">
			<label htmlFor={props.id}>{label}:</label>
			<Field className={error} {...field} {...props} />
			{meta.touched && meta.error ? (
				<div className="error">{meta.error}</div>
			) : null}
		</div>
	);
};