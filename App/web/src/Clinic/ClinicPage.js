//Reactjs:
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../Common/Components/Button';
import { Header } from '../Common/Components/Header';
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

export function ClinicPage() {
	const { clinic } = useParams(); //The ID of clinic.
	const [data, setData] = useState(null);

	useEffect(() => {
		if (clinic) {
			server.clinics.get({id: clinic}).then(clinic_data => {
				setData(clinic_data.data);
			});
		}
	}, [clinic]);

	
	let display = (
		<div className="Home buttonGrid">
			<Button label="Appointment Calendar" link={"/specific/clinic/appointments/calendar/" + clinic} />
			<Button label="Appointment List" link={"/specific/clinics/appointments/agenda/" + clinic} />
			<Button label="Work Schedules" link={"/specific/clinics/schedules/" + clinic} />
		</div>
	);

	return (
		<div className="Page">
			<Header />
			<h1>{data?.name + " Clinic"}</h1>
			<h2>Management</h2>
			<main>
				{display}
			</main>
		</div>
	);
}