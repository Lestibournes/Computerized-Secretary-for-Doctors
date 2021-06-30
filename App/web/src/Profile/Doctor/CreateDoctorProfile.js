import { Strings } from "../../Common/Classes/strings";
import { Button } from "../../Common/Components/Button";
import { Popup } from "../../Common/Components/Popup";
import { server } from "../../Common/server";
import { db } from "../../init";

export function createProfilePopup(popups, user) {
	const close = () => popups.remove(popup);
	
	const popup =
		<Popup key="Create Doctor Profile" title={Strings.instance.get(153)} close={close}>
			<div className="center">
				<h2>{Strings.instance.get(151)}</h2>
				<div className="buttonBar">
					<Button action={close} label={Strings.instance.get(43)} />
					<Button
						type="okay"
						action={() => {
							db.collection("users").doc(user).update({doctor: true})
							.then(close)
							.catch(reason => popups.error(reason.code));
						}}
						label={Strings.instance.get(44)}
					/>
				</div>
			</div>
		</Popup>;

	popups.add(popup);
}