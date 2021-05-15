import './Input.css';
import "./PictureInput.css";
import { Field, useField } from 'formik';

/**
 * A Formik text input component.
 */
 export const PictureInput = ({ label, src, alt, callback, ...props }) => {
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
		<div className="Picture">
			<label htmlFor={props.id} className={error}>
				<div>{label}</div>
				<img src={src} alt={alt} />
			</label>
			<Field
				type="file"
				onChange={e => callback(e.target.files[0])}
				{...props}
			/>
			{meta.touched && meta.error ? (
				<div className="error">{meta.error}</div>
			) : null}
		</div>
	);
};