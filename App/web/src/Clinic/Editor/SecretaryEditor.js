//Reactjs:
import React, { useEffect, useState } from 'react';
import { useAuth } from "../../Common/Auth";
import { Redirect, useParams } from 'react-router-dom';
import { Button } from "../../Common/Components/Button";

import { capitalize, getPictureURL } from '../../Common/functions';
import { Popup } from '../../Common/Components/Popup';
import { usePopups } from '../../Common/Popups';
import { Header } from '../../Common/Components/Header';
import { useRoot } from '../../Common/Root';
import { db } from '../../init';

export function SecretaryEditor() {
	const auth = useAuth();
	const root = useRoot();
	
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
	const popups = usePopups();

	useEffect(() => {
		if (secretary) {
			db.collection("users").doc(secretary).get()
			.then(secretary_snap => {
				setSecretaryData(secretary_snap.data());
			})
			.catch(reason => popups.error(reason.code));
		}
	}, [secretary]);

	useEffect(() => {
		if (clinic) {
			db.collection("clinics").doc(clinic).get().then(clinic_snap => {
				const data = clinic_snap.data();
				data.id = clinic_snap.id;
				setClinicData(data);
			})
		}
	}, [clinic]);

	let subtitle;
	let display;
	
	if (clinicData && secretaryData) {
		subtitle = secretaryData.fullName +" at " + clinicData.name;

		display = (
			<>
				{redirect ? <Redirect to={root.get() + redirect} /> : ""}
				<section>
					<header>
						<h2>Details</h2>
						<Button label="Remove" action={() => {
							const close = () => {
								popups.remove(popup);
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
										db.collection("clinics").doc(clinic).collection("secretaries").doc(secretary).delete()
										.then(() => setRedirect("/clinics/edit/" + clinic))
										.catch(reason => popups.error(reason.code));
									}} />
								</div>
							</Popup>;
						
							popups.add(popup);
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
		<div className="Page">
			<Header />
			<h1>Edit Secretary</h1>
			<h2>{subtitle}</h2>
			<main>
				{display}
			</main>
		</div>
	);
}