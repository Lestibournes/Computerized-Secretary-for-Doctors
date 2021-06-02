import "./DropdownMenu.css";
import { useState } from "react";

export function DropdownMenu({label, children}) {
	const [open, setOpen] = useState(false);

	return (
		<div className={"dropdown" + (open ? " open" : "")}>
			<div className={"label"} onClick={() => setOpen(!open)}>
				{label}
			</div>
			<div className={"menu"}>
				{children}
			</div>
		</div>
	);
}