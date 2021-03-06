import './Input.css';
import { Field, useField } from 'formik';
import { Fragment } from 'react';

/**
 * A Formik text input component.
 */
export const RadioInput = ({ label, options, initialValue, ...props }) => {
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
	
	const buttons = [];

	for (let option of options) {
		buttons.push(
			<div key={option}>
				<Field
					type="radio"
					{...field}
					{...props}
					value={option}
					id={option}
					name={props.name}
				/>
				<label htmlFor={option} className={error}>{option}</label>
			</div>
		)
	}
	
	return (
		<div className="Input Radio">
			<label>{label}</label>
			<div className="Group">
				{buttons}
			</div>
			{meta.touched && meta.error ? (
				<div className="error">{meta.error}</div>
			) : null}
		</div>
	);
};