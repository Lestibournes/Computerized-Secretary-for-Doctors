import { Popup } from "./Popup";
import { Button } from "./Button";

export function ErrorPopup({error, close}) {
	<Popup title={error.code} close={close}>
		<p>{error.message}</p>
		<Button label="Close" action={close} />
	</Popup>
}