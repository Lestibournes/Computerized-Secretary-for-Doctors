import "./DropdownMenu.css";
import { useState } from "react";

export function DropdownMenu({label, children}) {
	const [open, setOpen] = useState(false);

	return (
		<div className={"dropdown" + (open ? " open" : "")} onClick={() => setOpen(!open)}>
			<div className={"label"}>
				{label}
			</div>
			<div className={"menu"}>
				{children}
			</div>
		</div>
	);
}