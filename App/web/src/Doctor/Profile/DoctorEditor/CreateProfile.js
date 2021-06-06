import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { server } from "../../../Common/server";

export function createProfilePopup(popupManager, user, success) {
	const close = () => popupManager.remove(popup);
	
	const popup =
		<Popup title="Create Profile" close={close}>
			<div className="center">
				<h2>Would you like to register as a doctor?</h2>
				<div className="buttonBar">
					<Button action={close} label="No" />
					<Button type="okay" action={() => {
						server.doctors.create({user: user}).then(response => {
							if (response.data.success) success(response.data.doctor);
							else popupManager.error("You already have a doctor profile");
						});
					}} label="Yes" />
				</div>
			</div>
		</Popup>;

	popupManager.add(popup);
}