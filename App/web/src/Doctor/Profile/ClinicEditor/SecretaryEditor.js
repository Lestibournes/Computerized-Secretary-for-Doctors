//Reactjs:
import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../Common/Auth";
import { Redirect, useParams } from 'react-router-dom';
import { Button } from "../../../Common/Components/Button";
import { Page } from "../../../Common/Components/Page";

import { server } from '../../../Common/server';
import { capitalize, error, getPictureURL } from '../../../Common/functions';
import { Popup } from '../../../Common/Components/Popup';

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
	const [popupManager, setPopupManager] = useState({});

	useEffect(() => {
		if (secretary) {
			server.secretaries.getData({secretary: secretary}).then(response => {
				setSecretaryData(response.data);
			});
		}
	}, [secretary]);

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
						RemoveSecretaryPopup(popupManager, clinic, secretaryData, () => {
							setRedirect("/specific/doctor/clinics/edit/" + clinic);
						})
					}} /></span>
				</div>
				<div className="table">
					<b>Photo</b> <img src={image} alt={secretaryData.fullName} />
					<b>Name:</b> <span>{secretaryData.fullName}</span>
					<b>Sex:</b> <span>{secretaryData.sex ? capitalize(secretaryData.sex) : "Not specified"}</span>
				</div>
				{oops}
			</>
		);
	}

	return (
		<Page title="Edit Secretary" subtitle={subtitle} PopupManager={popupManager}>
			{display}
		</Page>
	);
}

export function RemoveSecretaryPopup(popupManager, clinic, secretaryData, success) {
	const close = () => {
		popupManager.removePopup(popup);
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
						error(popupManager,
							<div>
								{response.data.message}
							</div>
						);
					}
				})
			}} />
		</div>
	</Popup>;

	popupManager.addPopup(popup);
}