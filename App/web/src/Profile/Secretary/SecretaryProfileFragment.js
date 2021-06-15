import { useAuth } from "../../Common/Auth";
import { useEffect, useState } from "react";

import { Card } from "../../Common/Components/Card";
import { Popup } from "../../Common/Components/Popup";

import { SecretaryCreateProfileForm } from "./SecretaryCreateProfile";
import { server } from "../../Common/server";
import { usePopups } from "../../Common/Popups";
import { Loading } from "../../Common/Components/Loading";
import { useRoot } from "../../Common/Root";
import { db, fb } from "../../init";

export function SecretaryProfileFragment() {
	const auth = useAuth();
	const popups = usePopups();
	const root = useRoot();

	const [secretary, setSecretary] = useState();
	const [clinics, setClinics] = useState();
	const [clinicCards, setClinicCards] = useState();

	useEffect(() => {
		popups.clear();
	}, []);

	useEffect(() => {
		if (auth.user) {
			return db.collectionGroup("secretaries").where('user', '==', auth.user.uid).onSnapshot(secretary_snaps => {
				const promises = [];

				for (const secretary of secretary_snaps.docs) {
					const clinicRef = secretary.ref.parent.parent;

					promises.push(
						clinicRef.get().then(clinic_snap => {
							const data = clinic_snap.data();
							data.id = clinic_snap.id;
							return data;
						})
					);
				}

				Promise.all(promises).then(data => setClinics(data));
			});
		}
	}, [auth.user]);

	useEffect(() => {
		if (auth.user) {
			return db.collection("users").doc(auth.user.uid).onSnapshot(user_snap => {
				if (user_snap.data().secretary) setSecretary(user_snap.data());
				else {
					const close = () => {popups.remove(popup)}
	
					const popup =
						<Popup key="Create Secretary Profile" title="Create Secretary Profile" close={close}>
							<SecretaryCreateProfileForm
								user={auth.user.uid}
								success={
									secretary => {
										server.secretaries.getData({secretary: secretary}).then(results => {
											setSecretary(results.data);
										});
									}
								}
								close={close}
							/>
						</Popup>;
					
					popups.add(popup);
				}
			});
		}
	}, [auth.user]);

	useEffect(() => {
		if (clinics) {
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

			setClinicCards(clinics_list)
		};
	}, [clinics]);

	let display = <Loading />;

	if (secretary && clinics !== null) {
		display = (
			<>
				<h2>Secretary</h2>
				<section>
					<header>
						<h3>Clinics</h3>
					</header>
					<div className="cardList">
						{clinicCards ? clinicCards : "You are not currently employed in any clinic"}
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