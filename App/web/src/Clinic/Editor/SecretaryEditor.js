//Reactjs:
import React, { useEffect, useState } from 'react';
import { useAuth } from "../../Common/Auth";
import { Redirect, useParams } from 'react-router-dom';
import { Button } from "../../Common/Components/Button";

import { getPictureURL } from '../../Common/functions';
import { Popup } from '../../Common/Components/Popup';
import { usePopups } from '../../Common/Popups';
import { Header } from '../../Common/Components/Header';
import { useRoot } from '../../Common/Root';
import { db } from '../../init';
import { Strings } from '../../Common/Classes/strings';

export function SecretaryEditor() {
	const auth = useAuth();
	const root = useRoot();
	
	useEffect(() => {
		if (auth?.user?.uid) {
			getPictureURL(auth.user.uid).then(url => {
				setImage(url);
			});
		}
	}, [auth.user]);

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
		subtitle = Strings.instance.get(156, new Map([
			["name", secretaryData.fullName],
			["clinic", clinicData.name],
		]))
		display = (
			<>
				{redirect ? <Redirect to={root.get() + redirect} /> : ""}
				<section>
					<header>
						<h2>{Strings.instance.get(112)}</h2>
						<Button label={Strings.instance.get(187)} action={() => {
							const close = () => {
								popups.remove(popup);
							};
						
							const popup = 
							<Popup
								key="RemoveSecretary"
								title={Strings.instance.get(188)}
								close={close}
							>
								<div>
									{Strings.instance.get(190, new Map([["name", secretaryData.fullName]]))}
								</div>
								<div className="buttonBar">
									<Button label={Strings.instance.get(89)} type="okay" action={close} />
									<Button label={Strings.instance.get(44)} type="cancel" action={() => {
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
						<b>{Strings.instance.get(65)}:</b> <img src={image} alt={secretaryData.fullName} />
						<b>{Strings.instance.get(66)}:</b> <span>{secretaryData.fullName}</span>
						<b>{Strings.instance.get(67)}:</b> <span>
							{
								secretaryData.sex === "male" ? Strings.instance.get(103) :
								secretaryData.sex === "female" ? Strings.instance.get(104) :
								"Not specified"
							}
						</span>
					</div>
				</section>
			</>
		);
	}

	return (
		<div className="Page">
			<Header />
			<h1>{Strings.instance.get(185)}</h1>
			<h2>{subtitle}</h2>
			<main>
				{display}
			</main>
		</div>
	);
}