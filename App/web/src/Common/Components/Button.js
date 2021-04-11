import "./Button.css";

import { Link } from "react-router-dom";

export function Button({label, action, link, type}) {
	const types = {
		okay: "okay",
		cancel: "cancel",
		submit: "submit"
	}

	if (type === types.submit) {
		return (
			<button onClick={action} className="Button okay" type="submit">{label}</button>
		);
	}

	if (!link) {
		return (
			<button onClick={action} className={"Button" + (type ? " " + type : "")}>{label}</button>
		);
	}

	return (
		<Link to={link} onClick={action} className={"Button" + (type ? " " + type : "")}>{label}</Link>
	);
}