import { Button } from "./Button";
import "./Popup.css";

export function Popup({title, display, close}) {
	return (
		<div className="popup">
			<div className="controls">
				<div className="title">
					{title}
				</div>
				<div className="buttons">
					<Button label="x" action={close} />
				</div>
			</div>
			<div className="display">
				{display}
			</div>
		</div>
	);
}