import { Field, useField, useFormikContext } from "formik";
import { useEffect } from "react";
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
	
	const {
		setFieldValue
	} = useFormikContext();

	useEffect(() => {
		if (props.name && selected && setFieldValue) {
			setFieldValue(props.name, selected);
		}

	}, [props.name, selected, setFieldValue]);

	return (
		<div className="SelectList">
			<div className="header">
				<div className="label"><label htmlFor={props.id}>{label}:</label></div>
				<Field type="hidden" className={error} {...field} {...props} />
			</div>
			<div className="list">
				{options ? 
					options.length > 0 ?
						options.map(option => {
							return <div
								key={option}
								className={"item" + (selected === option || (selected && selected.compare && selected.compare(option) === 0) ? " selected" : "")}
								onClick={() => props.onClick(option)}
								>
									{option.toString()}
								</div>
						})
					: "No options available"
				: ""}
			</div>
			{meta.touched && meta.error ?
				<div className="error">{String(meta.error)}</div>
			: ""}
		</div>
	);
};