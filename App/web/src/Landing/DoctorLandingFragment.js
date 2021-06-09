//Reactjs:
import React, { useEffect, useState } from 'react';
import { Card } from "../Common/Components/Card"
import { Loading } from '../Common/Components/Loading';
import { server } from '../Common/server';

/**
@todo
Edit clinic page:
Can either be used to create a new clinic or edit an existing one. For an existing clinic it will show:
* Options to modify the name and location.
* A list of current members with the option to boot them.
* A list of pending membership requests with the option to accept or reject them.
* A button to go to a search page to find existing doctors and invite them to join the clinic.
*/

export function DoctorLandingFragment({doctor}) {
	const [data, setData] = useState(null);
	
	const [clinicsData, setClinicsData] = useState();
	const [clinicCards, setClinicCards] = useState();

	useEffect(() => {
		if (doctor) {
			server.doctors.getData({id: doctor}).then(doctor_data => {
				setData(doctor_data.data);

				server.doctors.getAllClinics({doctor: doctor}).then(clinics_data => {
					setClinicsData(clinics_data.data);
				});
			});
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
							link={"/" + data.doctor.link + "/" + clinic.id + "/" + doctor}
						/>
				});
			}

			cards.sort((a, b) => {
				if (a.name === b.name) {
					return 0;
				}
				else if (a.name < b.name) {
					return -1;
				}
				else {
					return 1;
				}
			});
			
			setClinicCards(cards.map(card => card.component));
		}
	}, [clinicsData, data, doctor]);

	let display = <Loading />;
	if (data && clinicCards) {
		display = (
			<>
				<main>
					<header>
						<h1>{data ? "Dr. " + data.user.fullName : ""}</h1>
					</header>
				</main>
				<section>
					<header>
						<h2>Clinics</h2>
					</header>
					<div className="cardList">
						{clinicCards}
					</div>
				</section>
			</>
		);
	}

	return (
		<>
			<main>
				{display}
			</main>
		</>
	);
}