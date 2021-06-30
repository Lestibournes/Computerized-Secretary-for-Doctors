//Reactjs:
import React, { useEffect, useState } from 'react';
import { Strings } from '../Common/Classes/strings';
import { Card } from "../Common/Components/Card"
import { Loading } from '../Common/Components/Loading';
import { capitalizeAll, getPictureURL } from '../Common/functions';
import { usePopups } from '../Common/Popups';
import { useRoot } from '../Common/Root';
import { db } from '../init';

/**
 * The clinic's home-page.
 * @param {{clinic: string}} props
 * @returns 
 */
export function ClinicLandingFragment({clinic}) {
	const root = useRoot();
	const popups = usePopups();

	const [clinicData, setClinicData] = useState(null);
	const [doctorsData, setDoctorsData] = useState();
	const [doctorCards, setDoctorCards] = useState();

	// Get clinic data:
	useEffect(() => {
		if (clinic) {
			return db.collection("clinics").doc(clinic).onSnapshot(
				clinic_snap => {
					if (clinic_snap.exists) {
						const data = clinic_snap.data();
						data.id = clinic_snap.id;
						setClinicData(data);
					}

					return null;
				},
				error => popups.error(error.message)
			);
		}
	}, [clinic]);

	// Get the doctors' data with their specializations:
	useEffect(() => {
		if (clinic) {
			return db.collection("clinics").doc(clinic).collection("doctors").onSnapshot(
				doctor_snaps => {
					const promises = [];

					for (const doctor_snap of doctor_snaps.docChanges()) {
						promises.push(
							db.collection("users").doc(doctor_snap.doc.id).get()
							.then(user_snap => {
								const data = user_snap.data();
								data.id = user_snap.id;

								return db.collection("users").doc(user_snap.id).collection("specializations").get()
								.then(spec_snaps => {
									data.specializations = [];

									for (const spec_snap of spec_snaps.docs) {
										const spec_data = spec_snap.data();
										spec_data.id = spec_snap.id;
										data.specializations.push(spec_data);
									}

									return data;
								});
							})
							.catch(reason => popups.error(reason.message))
						);
					}

					Promise.all(promises).then(user_data => {
						user_data.sort(
							(a, b) => {
								if (a.lastName > b.lastName) return 1;
								if (a.lastName < b.lastName) return -1;

								if (a.firstName > b.firstName) return 1;
								if (a.firstName < b.firstName) return -1;

								return 0;
							}
						);

						setDoctorsData(user_data);
					})
				},
				error => popups.error(error.message)
			);
		}
	}, [clinic]);

	useEffect(() => {
		if (doctorsData) {
			const promises = [];

			for (const doctor of doctorsData) {
				promises.push(getPictureURL(doctor.id).then(url => {
					const data = {
						data: doctor,
						card: 
							<Card
								key={doctor.id}
								title={doctor.fullName}
								body=
									{doctor.specializations.length > 0 ?
										doctor.specializations.map((specialization, index) => capitalizeAll(specialization.name) + (index < doctor.specializations.length - 1 ? ", "
										: ""))
									: Strings.instance.get(142)}
								image={url}
								link={root.get() + "/appointments/create/" + clinic + "/" + doctor.id}
							/>
					};

					return data;
				}));
			}

			Promise.all(promises).then(cards => {
				cards.sort((a, b) => {
					if (a.id === clinicData.owner) return 1;
					if (b.id === clinicData.owner) return -1;

					if (a.lastName > b.lastName) return 1;
					if (a.lastName < b.lastName) return -1;
					
					if (a.firstName > b.firstName) return 1;
					if (a.firstName < b.firstName) return -1;

					return 0;
				});
				
				setDoctorCards(cards.map(card => card.card));
			});
		}
	}, [doctorsData, clinicData, clinic]);

	let display = <Loading />;
	let title, subtitle;

	if (clinicData && doctorCards) {
		display = (
			<main>
				<h1>{Strings.instance.get(202, new Map([["clinic", clinicData.name]]))}</h1>
				<h2>
					{
					Strings.instance.get(204, new Map([
						["address", clinicData.address],
						["city", clinicData.city]
					]))
					}
				</h2>
				<section>
					<header>
						<h2>{Strings.instance.get(205)}</h2>
					</header>
					<div className="cardList">
						{doctorCards}
					</div>
				</section>
			</main>
		);
	}

	return display;
}