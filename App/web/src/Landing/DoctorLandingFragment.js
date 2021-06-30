//Reactjs:
import React, { useEffect, useState } from 'react';
import { Strings } from '../Common/Classes/strings';
import { Card } from "../Common/Components/Card"
import { Loading } from '../Common/Components/Loading';
import { usePopups } from '../Common/Popups';
import { useRoot } from '../Common/Root';
import { db } from '../init';

/**
 * The doctor's home page.
 * @param {{doctor: string}} props
 * @returns 
 */
export function DoctorLandingFragment({doctor}) {
	const root = useRoot();
	const popups = usePopups();

	const [doctorData, setDoctorData] = useState(null);
	const [clinicsData, setClinicsData] = useState();
	const [clinicCards, setClinicCards] = useState();

	useEffect(() => {
		if (doctor) {
			db.collection("users").doc(doctor).get().then(
				doctor_snap => {
					const doctor_data = doctor_snap.data();
					doctor_data.id = doctor_snap.id;
					setDoctorData(doctor_data);
				}
			)
			.catch(reason => popups.error(reason.message));

			return db.collectionGroup("doctors").where("user", "==", doctor).onSnapshot(
				doctor_snaps => {
					const promises = [];
					
					for (const doctor_snap of doctor_snaps.docs) {
						const clinicRef = doctor_snap.ref.parent.parent;

						if (clinicRef) {
							promises.push(
								clinicRef.get()
								.then(clinic_snap => {
									if (clinic_snap.exists) {
										const clinic = clinic_snap.data();
										clinic.id = clinic_snap.id;
										return clinic;
									}
									
									return null;
								})
								.catch(reason => popups.error(reason.message))
							)
						}
					}

					Promise.all(promises).then(
						clinic_data => {
							const clinics = [];

							for (const clinic of clinic_data) {
								if (clinic) clinics.push(clinic);
							}

							setClinicsData(clinics);
						}
					);
				},
				error => popups.error(error.message)
			);
		}
	}, [doctor]);


	useEffect(() => {
		if (clinicsData) {
			const cards = [];

			for (const clinic of clinicsData) {
				cards.push({
					name: clinic.name,
					id: clinic.id,
					component:
						<Card
							key={clinic.id}
							title={clinic.name}
							body={clinic.city}
							footer={clinic.address}
							link={root.get() + "/appointments/create/" + clinic.id + "/" + doctor}
						/>
				});
			}

			cards.sort((a, b) => {return a.name > b.name ? 1 : a.name < b.name ? -1 : 0});
			
			setClinicCards(cards.map(card => card.component));
		}
	}, [clinicsData, doctorData, doctor]);

	let display = <Loading />;

	if (doctorData && clinicCards) {
		display = (
			<main>
				<h1>{doctorData ? Strings.instance.get(200, new Map([["name", doctorData.fullName]])) : ""}</h1>
				<section>
					<header>
						<h2>{Strings.instance.get(46)}</h2>
					</header>
					<div className="cardList">
						{clinicCards}
					</div>
				</section>
			</main>
		);
	}

	return display;
}