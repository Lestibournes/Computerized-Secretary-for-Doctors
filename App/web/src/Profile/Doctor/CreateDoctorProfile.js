import { Button } from "../../Common/Components/Button";
import { Popup } from "../../Common/Components/Popup";
import { server } from "../../Common/server";
import { db } from "../../init";

export function createProfilePopup(popups, user) {
	const close = () => popups.remove(popup);
	
	const popup =
		<Popup key="Create Doctor Profile" title="Create Doctor Profile" close={close}>
			<div className="center">
				<h2>Would you like to create a doctor profile?</h2>
				<div className="buttonBar">
					<Button action={close} label="No" />
					<Button
						type="okay"
						action={() => {
							db.collection("users").doc(user).update({doctor: true})
							.then(close)
							.catch(reason => popups.error(reason));
						}}
						label="Yes"
					/>
				</div>
			</div>
		</Popup>;

	popups.add(popup);
}