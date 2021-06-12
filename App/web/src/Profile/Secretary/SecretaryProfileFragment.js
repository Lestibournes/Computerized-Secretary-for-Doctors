import { useAuth } from "../../Common/Auth";
import { useEffect, useState } from "react";

import { Card } from "../../Common/Components/Card";
import { Popup } from "../../Common/Components/Popup";

import { SecretaryCreateProfile, secretaryCreateProfilePopup as secretaryCreateProfilePopup } from "./SecretaryCreateProfile";
import { server } from "../../Common/server";
import { usePopups } from "../../Common/Popups";
import { Loading } from "../../Common/Components/Loading";
import { useRoot } from "../../Common/Root";

export function SecretaryProfileFragment() {
	const auth = useAuth();
	const popupManager = usePopups();
	const root = useRoot();

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
		return server.users.isSecretary({id: user}).then(response => {
			if (response.data) {
				return server.secretaries.getData({secretary: user}).then(results => {
					return setSecretary(results.data);
				});
			}
			else {
				secretaryCreateProfilePopup(
					popupManager,
					auth.user.uid,
					secretary => {
						server.secretaries.getData({secretary: secretary}).then(results => {
							setSecretary(results.data);
						});
					}
				);
			}
		});
	}

	useEffect(() => {
		if (secretary) {
			const clinics = secretary.clinics
			const clinics_list = [];
		
			for (let clinic_data of clinics) {
				clinics_list.push(
					<Card
						key={clinic_data.id}
						title={clinic_data.name}
						body={clinic_data.city}
						footer={clinic_data.address}
						link={root.get() + "/clinics/view/" + clinic_data.id}
					/>
				);
			}

			setClinics(clinics_list)
		};
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

	return (
			<>
				{display}
			</>
	);
}