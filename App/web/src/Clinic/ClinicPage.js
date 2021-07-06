//Reactjs:
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../Common/Components/Button';
import { Header } from '../Common/Components/Header';
import { usePopups } from '../Common/Popups';
import { useRoot } from '../Common/Root';
import { Loading } from '../Common/Components/Loading';
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

export function ClinicPage() {
	const root = useRoot();
	const popups = usePopups ();

	const { clinic } = useParams(); //The ID of clinic.
	const [data, setData] = useState(null);

	useEffect(() => {
		if (clinic) {
			db.collection("clinics").doc(clinic).onSnapshot(
				clinic_snap => {
					if (clinic_snap.exists) {
						const data = clinic_snap.data();
						data.id = clinic_snap.id;
						setData(data);
					}
					else popups.error("Clinic not found");
				},
				error => popups.error(error.message)
			);
		}
	}, [clinic]);

	let display = <Loading />;
	
	if (data) {
		display = (
			<>
				<h1>{Strings.instance.get(192, new Map([["clinic", data.name]]))}</h1>
				<h2>{Strings.instance.get(193)}</h2>
				<main>
					<div className="Home buttonGrid">
						<Button label={Strings.instance.get(194)} link={root.get() + "/clinic/appointments/calendar/" + clinic} />
						<Button label={Strings.instance.get(195)} link={root.get() + "/clinics/appointments/agenda/" + clinic} />
						<Button label={Strings.instance.get(196)} link={root.get() + "/clinics/schedules/" + clinic} />
					</div>
				</main>
			</>
		);
	}
	
	return (
		<div className="Page">
			<Header />
			{display}
		</div>
	);
}