//Reactjs:
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loading } from "../Common/Components/Loading";
import { Card } from "../Common/Components/Card";
import { Header } from '../Common/Components/Header';
import { capitalizeAll, getPictureURL } from "../Common/functions";
import { usePopups } from '../Common/Popups';
import { useRoot } from '../Common/Root';
import { db } from '../init';
import { Strings } from '../Common/Classes/strings';

/**
@todo
Edit clinic page:
Can either be used to create a new clinic or edit an existing one. For an existing clinic it will show:
* Options to modify the name and location.
* A list of current members with the option to boot them.
* A list of pending membership requests with the option to accept or reject them.
* A button to go to a search page to find existing doctors and invite them to join the clinic.
*/
export function ClinicSchedulesPage() {
	const root = useRoot();
	const popups = usePopups();

	const { clinic } = useParams(); //The ID of clinic.
	const [clinicData, setClinicData] = useState(null);

	const [doctorsData, setDoctorsData] = useState();
	const [doctorCards, setDoctorCards] = useState();

	useEffect(() => {
		if (clinic) {
			db.collection("clinics").doc(clinic).get().then(
				clinic_snap => {
					const clinic_data = clinic_snap.data();
					clinic_data.id = clinic_snap.id;
					setClinicData(clinic_data);
				}
			);

			db.collection("clinics").doc(clinic).collection("doctors").get().then(
				doctor_snaps => {
					const promises = [];

					for (const doctor_snap of doctor_snaps.docs) {
						promises.push(
							db.collection("users").doc(doctor_snap.id).get().then(
								user_snap => {
									const user_data = user_snap.data();
									user_data.id = user_snap.id;
									return user_data;
								}
							)
							.catch(reason => popups.error(reason.message))
						);
					}

					Promise.all(promises).then(data => setDoctorsData(data));
				}
			);
		}
	}, [clinic]);


	useEffect(() => {
		if (doctorsData) {
			const promises = [];

			for (const doctor of doctorsData) {
				promises.push(
					getPictureURL(doctor.id).then(url => {
						return db.collection("users").doc(doctor.id).get().then(
							doctor_snap => {
								const doctor_data = doctor_snap.data();
								doctor_data.id = doctor_snap.id;

								return db.collection("users").doc(doctor.id).collection("specializations").get().then(
									spec_snaps => {
										const card = (<Card
											key={doctor.id}
											title={doctor_data.fullName + (doctor.id === clinicData.owner ? " (♚ owner)" : "")}
											body=
												{spec_snaps.size > 0 ?
													spec_snaps.docs.map((spec, index) => capitalizeAll(spec.data().name) +
													(index < spec_snaps.size - 1 ? ", " : ""))
												: Strings.instance.get(142)}
											image={url}
											link={root.get() + "/clinics/schedule/edit/" + clinic + "/" + doctor.id}
										/>);
						
										return {
											data: doctor_data,
											card: card
										};
									}
								)
							}
						)
						.catch(reason => popups.error(reason.message));
					})
				);
			}

			Promise.all(promises).then(cards => {
				cards.sort((a, b) => {
					if (a.data.id === clinicData.owner) {
						return 1;
					};
		
					if (b.data.id === clinicData.owner) {
						return -1;
					};
	
					if (a.data.lastName > b.data.lastName) return 1;
					if (a.data.lastName < b.data.lastName) return -1;

					if (a.data.firstName > b.data.firstName) return 1;
					if (a.data.firstName < b.data.firstName) return -1;

					return 0
				});
				
				setDoctorCards(cards.map(card => card.card));
			});
		}
	}, [doctorsData, clinicData, clinic]);
	
	let display = <Loading />;
	if (doctorCards) {
		display = (
			<>
				<div className="cardList">
					{doctorCards}
				</div>
			</>
		);
	}

	return (
		<div className="Page">
			<Header />
			<h1>{clinicData?.name}</h1>
			<h2>{Strings.instance.get(198)}</h2>
			<main>
				{display}
			</main>
		</div>
	);
}