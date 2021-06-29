import { useState } from "react";
import { Redirect } from "react-router-dom";
import { Strings } from "../../Common/Classes/strings";
import { Button } from "../../Common/Components/Button";
import { Popup } from "../../Common/Components/Popup";
import { usePopups } from "../../Common/Popups";
import { useRoot } from "../../Common/Root";
import { db } from "../../init";

export function SecretaryCreateProfileForm({user, close}) {
	const root = useRoot();
	const popups = usePopups();

	const [no, setNo] = useState(false);

	return (
		<div className="center">
			{no ? <Redirect to={root.get() + "/user/profile"} /> : ""}
			<h2>{Strings.instance.get(41)}</h2>
			<div className="buttonBar">
				<Button action={() => {setNo(true)}} label={Strings.instance.get(43)} />
				<Button
					type="okay"
					action={() => {
						db.collection("users").doc(user).update({secretary: true})
						.then(() => close())
						.catch(reason => popups.error(reason.code));
						}}
					label={Strings.instance.get(44)}
				/>
			</div>
		</div>
	);
}