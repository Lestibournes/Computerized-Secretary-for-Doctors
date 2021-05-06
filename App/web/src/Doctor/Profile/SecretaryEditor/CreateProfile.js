import { fn } from "../../../init";
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";

const createSecretary = fn.httpsCallable("secretaries-create");

export function CreateProfile({user, success, failure, close}) {
	return (<Popup
		title="Create Profile"
		display={
		<div className="center">
			<h2>Would you like to register as a secretary?</h2>
			<div className="buttonBar">
				<Button action={close} label="No" />
				<Button type="okay" action={() => {
					createSecretary({user: user}).then(response => {
						if (response.data.success) success(response.data.secretary);
						else failure();
					});
				}} label="Yes" />
			</div>
		</div>}
		close={close}
	/>);
}