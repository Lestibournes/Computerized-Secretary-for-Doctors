//Reactjs:
import React, { useEffect, useState } from 'react';
import { Card } from "../Common/Components/Card"
import { Header } from '../Common/Components/Header';
import { getPictureURL } from '../Common/functions';
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

export function ClinicLandingFragment({clinic}) {
	const [data, setData] = useState(null);
	
	const [doctorsData, setDoctorsData] = useState();
	const [doctorCards, setDoctorCards] = useState();

	useEffect(() => {
		if (clinic) {
			server.clinics.get({id: clinic}).then(clinic_data => {
				setData(clinic_data.data);

				server.clinics.getAllDoctors({clinic: clinic}).then(doctors_data => {
					setDoctorsData(doctors_data.data);
				});
			});
		}
	}, [clinic]);


	useEffect(() => {
		if (doctorsData) {
			const promises = [];

			for (const doctor of doctorsData) {
				promises.push(getPictureURL(doctor.user.id).then(url => {
					doctor.image = url;

					const card = (<Card
						key={doctor.doctor.id}
						title={doctor.user.firstName + " " + doctor.user.lastName}
						body=
							{doctor.fields.length > 0 ?
								doctor.fields.map((field, index) => field.id + (index < doctor.fields.length - 1 ? ", "
								: ""))
							: "No specializations specified"}
						image={doctor.image}
						link={"/" + data.link + "/" + clinic + "/" + doctor.doctor.id}
					/>);
	
					return {
						name: doctor.user.lastName + doctor.user.firstName,
						id: doctor.doctor.id,
						component: card
					};
				}));
			}

			Promise.all(promises).then(cards => {
				cards.sort((a, b) => {
					if (a.id === data.owner) {
						return -1;
					};
		
					if (b.id === data.owner) {
						return 1;
					};
	
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
				
				setDoctorCards(cards.map(card => card.component));
			});
		}
	}, [doctorsData, data, clinic]);

	let display, title, subtitle;

	if (data && doctorCards) {
		title = data.name + " Clinic";
		subtitle = data.address + ", " + data.city;

		display = (
			<>
				<section>
					<header>
						<h2>Doctors</h2>
					</header>
					<div className="cardList">
						{doctorCards}
					</div>
				</section>
			</>
		);
	}

	return (
		<>
			<h1>{title}</h1>
			<h2>{subtitle}</h2>
			<main>
				{display}
			</main>
		</>
	);
}