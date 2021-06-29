import { useAuth } from "../../Common/Auth";
import { useEffect, useState } from "react";

import { Card } from "../../Common/Components/Card";
import { Popup } from "../../Common/Components/Popup";

import { SecretaryCreateProfileForm } from "./SecretaryCreateProfile";
import { usePopups } from "../../Common/Popups";
import { Loading } from "../../Common/Components/Loading";
import { useRoot } from "../../Common/Root";
import { db } from "../../init";
import { Strings } from "../../Common/Classes/strings";

export function SecretaryProfileFragment() {
	const auth = useAuth();
	const popups = usePopups();
	const root = useRoot();

	const [secretary, setSecretary] = useState();
	const [clinics, setClinics] = useState();
	const [clinicCards, setClinicCards] = useState();

	// Get all the clinics where the current user works as a secretary:
	useEffect(() => {
		if (auth?.user?.uid) {
			return db.collectionGroup("secretaries")
			.where('user', '==', auth.user.uid)
			.onSnapshot(
				secretary_snaps => {
					const promises = [];

					for (const secretary of secretary_snaps.docs) {
						const clinicRef = secretary.ref.parent.parent;

						promises.push(
							clinicRef.get().then(clinic_snap => {
								const data = clinic_snap.data();
								data.id = clinic_snap.id;
								return data;
							})
							.catch(reason => popups.error(reason.message))
						);
					}

					Promise.all(promises).then(data => setClinics(data));
				},
				error => popups.error(error.message)
			);
		}
	}, [auth.user]);

	// Get the current user's user data:
	useEffect(() => {
		if (auth?.user?.uid) {
			return db.collection("users").doc(auth.user.uid).onSnapshot(
				user_snap => {
					if (user_snap.data().secretary) {
						const sec_data = user_snap.data();
						sec_data.id = user_snap.id;
						setSecretary(sec_data);
					}
					else {
						// If the user isn't a secretary, ask if he'd like to be one:
						const close = () => {popups.remove(popup)}
		
						const popup =
							<Popup key="Create Secretary Profile" title={Strings.instance.get(39)} close={close}>
								<SecretaryCreateProfileForm
									user={auth.user.uid}
									close={close}
								/>
							</Popup>;
						
						popups.add(popup);
					}
				},
				error => popups.error(error.message)
			);
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
				<h2>{Strings.instance.get(30)}</h2>
				<section>
					<header>
						<h3>{Strings.instance.get(46)}</h3>
					</header>
					<div className="cardList">
						{clinicCards ? clinicCards : Strings.instance.get(47)}
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