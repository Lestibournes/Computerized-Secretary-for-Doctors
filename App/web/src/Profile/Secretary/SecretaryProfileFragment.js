import { useAuth } from "../../Common/Auth";
import { useEffect, useState } from "react";

import { Card } from "../../Common/Components/Card";
import { Popup } from "../../Common/Components/Popup";

import { SecretaryCreateProfile } from "./SecretaryCreateProfile";
import { getPictureURL } from "../../Common/functions";
import { server } from "../../Common/server";
import { usePopups } from "../../Common/Popups";
import { Loading } from "../../Common/Components/Loading";

function generateClinicCards(secretary, clinics) {
	const clinics_list = [];
		
	for (let clinic_data of clinics) {
		clinics_list.push(
			<Card
				key={clinic_data.id}
				title={clinic_data.name}
				body={clinic_data.city}
				footer={clinic_data.address}
				link={"/specific/secretary/clinics/view/" + clinic_data.id}
			/>
		);
	}

	return clinics_list;
}

export function SecretaryProfileFragment() {
	const auth = useAuth();
	const popupManager = usePopups();

	const [secretary, setSecretary] = useState(null);
	const [clinics, setClinics] = useState(null);
	const [createProfile, setCreateProfile] = useState(false);
	const [alreadyExists, setAlreadyExists] = useState(false);

	useEffect(() => {
		popupManager.clear();
	}, []);

	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (auth.user) loadData(auth.user.uid);
		});

		return unsubscribe;
	}, [auth]);

	async function loadData(user) {
		return server.secretaries.getID({user: user}).then(response => {
			if (response.data) {
				return server.secretaries.getData({secretary: response.data}).then(results => {
					return setSecretary(results.data);
				});
			}
			else {
				return setCreateProfile(true);
			}
		});
	}

	useEffect(() => {
		if (secretary) setClinics(generateClinicCards(secretary.id, secretary.clinics));
	}, [secretary]);

	let display = <Loading />;

	if (secretary && clinics) {
		display = (
			<>
				<h2>Secretary</h2>
				<section>
					<header>
						<h3>Clinics</h3>
					</header>
					<div className="cardList">
						{clinics}
					</div>
				</section>
			</>
		);
	}

	const popups =
	<>
		{createProfile && auth.user ?
			<SecretaryCreateProfile
				user={auth.user.uid}
				success={secretary => {
					setCreateProfile(false);
					server.secretaries.getData({secretary: secretary}).then(results => {
						setSecretary(results.data);
					});
				}}
				failure={() => setAlreadyExists(true)}
				close={() => {window.history.back()}}
			/>
		: ""}

		{alreadyExists ?
			<Popup
				title="Info"
				close={() => {
					setAlreadyExists(false);
					setCreateProfile(false);
				}}
			>
				<div>You already have a secretary profile</div>
			</Popup>
		: ""}
	</>;

	return (
			<>
				{popups}
				{display}
			</>
	);
}