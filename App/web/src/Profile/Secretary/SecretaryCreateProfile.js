import { useState } from "react";
import { Redirect } from "react-router-dom";
import { Button } from "../../Common/Components/Button";
import { Popup } from "../../Common/Components/Popup";
import { usePopups } from "../../Common/Popups";
import { useRoot } from "../../Common/Root";
import { server } from "../../Common/server";

export function SecretaryCreateProfileForm({user, success, close}) {
	const root = useRoot();
	const popups = usePopups();

	const [no, setNo] = useState(false);

	return (
		<div className="center">
			{no ? <Redirect to={root.get() + "/user/profile"} /> : ""}
			<h2>Would you like to a secretary profile?</h2>
			<div className="buttonBar">
				<Button action={() => {setNo(true)}} label="No" />
				<Button type="okay" action={() => {
					server.secretaries.create({user: user}).then(response => {
						if (response.data.success) {
							success(response.data.secretary);
							close();
						}
						else popups.error(<div>You already have a secretary profile</div>);
					});
				}} label="Yes" />
			</div>
		</div>
	);
}

export function secretaryCreateProfilePopup(popups, user, success) {
	const close = () => {popups.remove(popup)}

	const popup =
		<Popup key="Create Secretary Profile" title="Create Secretary Profile" close={close}>
			<SecretaryCreateProfileForm
				user={user}
				success={success}
				close={close}
			/>
		</Popup>;

	popups.add(popup);
}