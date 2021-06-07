import { Button } from "../../Common/Components/Button";
import { Popup } from "../../Common/Components/Popup";
import { server } from "../../Common/server";

export function SecretaryCreateProfile({user, success, failure, close}) {
	return (
		<Popup title="Create Profile" close={close}>
			<div className="center">
				<h2>Would you like to register as a secretary?</h2>
				<div className="buttonBar">
					<Button action={close} label="No" />
					<Button type="okay" action={() => {
						server.secretaries.create({user: user}).then(response => {
							if (response.data.success) success(response.data.secretary);
							else failure();
						});
					}} label="Yes" />
				</div>
			</div>
		</Popup>
	);
}