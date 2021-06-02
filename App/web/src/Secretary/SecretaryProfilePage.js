import { useAuth } from "../Common/Auth";
import { useEffect, useState } from "react";

import { Card } from "../Common/Components/Card";
import { Button } from "../Common/Components/Button";
import { Popup } from "../Common/Components/Popup";

import { Page } from "../Common/Components/Page";
import { SecretaryCreateProfile } from "./SecretaryCreateProfile";
import { UserEditForm } from "../Doctor/Profile/UserEditor/UserEditForm";
import { capitalizeAll, getPictureURL } from "../Common/functions";
import { server } from "../Common/server";

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

export function SecretaryProfilePage() {
	const auth = useAuth();

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
	const [secretary, setSecretary] = useState(null);
	const [image, setImage] = useState(null);
	const [clinics, setClinics] = useState(null);
	const [createProfile, setCreateProfile] = useState(false);
	const [alreadyExists, setAlreadyExists] = useState(false);
	const [editData, setEditData] = useState(false);

	useEffect(() => {
		if (secretary) {
			setClinics(generateClinicCards(secretary.id, secretary.clinics));

			getPictureURL(secretary.user.id).then(url => {
				setImage(url);
			});
		}
	}, [secretary]);

	let display = <h2>Loading...</h2>;

	if (secretary && clinics) {
		display = (
			<>
				<div className="headerbar">
					<h2>Clinics</h2>
				</div>
				<div className="cardList">
					{clinics}
				</div>
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
			<Page title="Secretary Profile">
				{popups}
				{display}
			</Page>
	);
}