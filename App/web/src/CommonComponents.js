import React from 'react';
import { useField } from 'formik';

export const TextInput = ({ label, ...props }) => {
	// useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
	// which we can spread on <input> and alse replace ErrorMessage entirely.
	const [field, meta] = useField(props);
	const error = meta.touched && meta.error ? "error" : null;
	if (!props.id) {
		props.id = props.name;
	}
	else if (!props.name) {
		props.name = props.id;
	}
	
	return (
		<>
		<label htmlFor={props.id}>{label}</label>
			<input className={error} {...field} {...props} />
			{meta.touched && meta.error ? (
				<div className="error">{meta.error}</div>
			) : null}
		</>
	);
};

export class MainHeader extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="mainHeader">
				<div className="title">CSFPD</div>
				<div className="section">{this.props.section}</div>
			</div>
		);
	}
}

export class MainMenu extends React.Component {
	render() {
		return (
			<div className="mainMenu">
				Home
			</div>
		);
	}
}