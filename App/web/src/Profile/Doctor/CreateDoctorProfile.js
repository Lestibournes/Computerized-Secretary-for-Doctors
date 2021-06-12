import { Button } from "../../Common/Components/Button";
import { Popup } from "../../Common/Components/Popup";
import { server } from "../../Common/server";

export function createProfilePopup(popups, user, success) {
	const close = () => popups.remove(popup);
	
	const popup =
		<Popup key="Create Doctor Profile" title="Create Doctor Profile" close={close}>
			<div className="center">
				<h2>Would you like to create a doctor profile?</h2>
				<div className="buttonBar">
					<Button action={close} label="No" />
					<Button type="okay" action={() => {
						server.doctors.create({user: user}).then(response => {
							if (response.data.success) {
								success(response.data.doctor);
								close();
							}
							else popups.error("You already have a doctor profile");
						});
					}} label="Yes" />
				</div>
			</div>
		</Popup>;

	popups.add(popup);
}