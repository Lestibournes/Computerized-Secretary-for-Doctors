import { Button } from "./Button";
import "./Popup.css";

export function Popup({title, display, close}) {
	return (
		<div className="Popup">
			<div className="controls">
				<div className="title">
					{title ? title : ""}
				</div>
				<div className="buttons">
					{close ? <Button label="x" action={close} /> : ""}
				</div>
			</div>
			<div className="display">
				{display}
			</div>
		</div>
	);
}