//Reactjs:
import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../Common/Auth";
import { Redirect, useParams } from 'react-router-dom';
import { Button } from "../../../Common/Components/Button";
import { Page } from "../../../Common/Components/Page";
import { Card } from '../../../Common/Components/Card';

import { Time } from '../../../Common/classes';
import { server } from '../../../Common/server';
import { capitalize, compareByName, error, getPictureURL } from '../../../Common/functions';
import { Popup } from '../../../Common/Components/Popup';
import { UserEditPopup } from '../../../User/UserEditForm';

export function SecretaryEditor() {
	const auth = useAuth();
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (auth.user) {
				getPictureURL(auth.user.uid).then(url => {
					setImage(url);
				});
			}
		});

		return unsubscribe;
	}, [auth]);

	const { clinic, secretary } = useParams(); //The ID of clinic and doctor

	const [clinicData, setClinicData] = useState(null);
	const [secretaryData, setSecretaryData] = useState(null);
	const [image, setImage] = useState(null);
	
	const [redirect, setRedirect] = useState(null); //Where to redirect to in case the doctor is removed from the clinic.
	const [popups, setPopups] = useState([]);

	useEffect(() => {
		if (secretary) {
			server.secretaries.getData({secretary: secretary}).then(response => {
				setSecretaryData(response.data);
			});
		}
	}, [secretary]);

	function addPopup(popup) {
		let exists = false;

		for (const old_popup of popups) {
			if (old_popup.key === popup.key) {
				exists = true;
			}
		}

		if (!exists) {
			const new_popups = [...popups];
			new_popups.push(popup);
			setPopups(new_popups);
		}
	}

	function removePopup(popup) {
		const new_popups = [];

		for (const p of popups) {
			if (p !== popup) {
				new_popups.push(p);
			}
		}

		setPopups(new_popups);
	}

	useEffect(() => {
		if (clinic) {
			server.clinics.get({id: clinic}).then(clinic_data => {
				setClinicData(clinic_data.data);
			});
		}
	}, [clinic]);

	let subtitle;
	let display;

	const oops = [];
	
	if (clinicData && secretaryData) {
		subtitle = secretaryData.fullName +" at " + clinicData.name;

		display = (
			<>
				{redirect ? <Redirect to={redirect} /> : ""}
				<div className="headerbar">
					<h2>Details</h2><span><Button label="Remove" action={() => {
						removeSecretaryPopup(addPopup, removePopup, clinic, secretaryData, () => {
							setRedirect("/specific/doctor/clinics/edit/" + clinic);
						})
					}} /></span>
				</div>
				<div className="table">
					<b>Photo</b> <img src={image} alt={secretaryData.fullName} />
					<b>Name:</b> <span>{secretaryData.fullName}</span>
					<b>Sex:</b> <span>{secretaryData.sex ? capitalize(secretaryData.sex) : "Not specified"}</span>
				</div>
			</>
		);
	}

	return (
		<Page title="Edit Secretary" subtitle={subtitle} popups={popups.concat(oops)}>
			{display}
		</Page>
	);
}

export function removeSecretaryPopup(addPopup, removePopup, clinic, secretaryData, success) {
	const close = () => {
		removePopup(popup);
	};

	const popup = 
	<Popup
		key="RemoveSecretary"
		title="Remove Secretary"
		close={close}
	>
		<div>
			Are you sure you want to remove {secretaryData.fullName} from your clinic?
		</div>
		<div className="buttonBar">
			<Button label="Cancel" type="okay" action={close} />
			<Button label="Yes" type="cancel" action={() => {
				server.clinics.removeSecretary({clinic: clinic, secretary: secretaryData.id}).then(response => {
					if (response.data.success) {
						success();
					}
					else {
						error(addPopup, removePopup,
							<div>
								{response.data.message}
							</div>
						);
					}
				})
			}} />
		</div>
	</Popup>;

	addPopup(popup);
}