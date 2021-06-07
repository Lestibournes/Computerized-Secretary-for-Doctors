//Reactjs:
import React, { useEffect, useState } from 'react';
import { useAuth } from "../../Common/Auth";
import { Redirect, useParams } from 'react-router-dom';
import { Button } from "../../Common/Components/Button";
import { Page } from "../../Common/Components/Page";

import { server } from '../../Common/server';
import { capitalize, getPictureURL } from '../../Common/functions';
import { Popup } from '../../Common/Components/Popup';
import { usePopups } from '../../Common/Popups';

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
	const popupManager = usePopups();

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
	
	if (clinicData && secretaryData) {
		subtitle = secretaryData.fullName +" at " + clinicData.name;

		display = (
			<>
				{redirect ? <Redirect to={redirect} /> : ""}
				<section>
					<header>
						<h2>Details</h2>
						<Button label="Remove" action={() => {
							removeSecretaryPopup(popupManager, clinic, secretaryData, () => {
								setRedirect("/specific/doctor/clinics/edit/" + clinic);
							})
						}} />
					</header>
					<div className="table">
						<b>Photo</b> <img src={image} alt={secretaryData.fullName} />
						<b>Name:</b> <span>{secretaryData.fullName}</span>
						<b>Sex:</b> <span>{secretaryData.sex ? capitalize(secretaryData.sex) : "Not specified"}</span>
					</div>
				</section>
			</>
		);
	}

	return (
		<Page title="Edit Secretary" subtitle={subtitle}>
			{display}
		</Page>
	);
}

export function removeSecretaryPopup(popupManager, clinic, secretaryData, success) {
	const close = () => {
		popupManager.remove(popup);
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
					if (response.data.success) success();
					else popupManager.error(response.data.message)
				})
			}} />
		</div>
	</Popup>;

	popupManager.add(popup);
}