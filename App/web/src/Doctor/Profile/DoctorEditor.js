import "./DoctorEditor.css";
import { MainHeader, useAuth } from "../../Common/CommonComponents";
import { Redirect } from 'react-router-dom';
import { useEffect, useState } from "react";
import { db, fn } from "../../init";

import { Card } from "../../Common/Components/Card";
import { Button } from "../../Common/Components/Button";

/**
@todo
Edit Profile:
If the user doesn't have a doctor profile, offer to create one (in the future, require that a profile creation request be approved before it goes live):
No - go back.
Yes - show a list of clinics with buttons to create a new clinic or join an exiting one that belongs to another doctor.
Select a clinic - if it's owned by the current user then go to the edit clinic page. If not, then it will go to the view clinic page.
Create clinic - go to the edit clinic page or a create clinic page.
Join clinic - go to a search page.

Join clinic:
Can search by name and filter by city.
Clicking on a result will take the user to the view clinic page.

View clinic page:
Shows the name, city, and address of the clinic as well as the owner and maybe other doctors who work there(?). Has a button to join/leave the clinic.
If you click to join then a request is submitted. The owner will see pending requests, and if he approves then and only then will you be added to the clinic as a member.
This means each clinic needs the following fields:
* owner
* current members
* pending membership requests
Also, it should have a button to go to the schedule editor page, and for current members, to the schedule viewing page.

Edit clinic page:
Can either be used to create a new clinic or edit an existing one. For an existing clinic it will show:
* Options to modify the name and location.
* A list of current members with the option to boot them.
* A list of pending membership requests with the option to accept or reject them.
* A button to go to a search page to find existing doctors and invite them to join the clinic.

Edit schedule page:
For each day of the week, have buttons to add a shift.
For each shift, select start and end time or remove the shift.

It would be good to add some kind of notification widget to easily show new membership requests, private messages from clients, or whatever else.
*/

const getDoctor = fn.httpsCallable("doctors-get");
const createDoctor = fn.httpsCallable("doctors-create");
const getAllClinics = fn.httpsCallable("doctors-getAllClinics");

function ClinicList({doctor, clinics = []}) {
	const clinics_list = [];
	
	for (let clinic_data of clinics) {
		clinics_list.push(
			<Card
				title={clinic_data.name}
				body={clinic_data.city}
				footer={clinic_data.address}
				link={(
					clinic_data.owner === doctor ?
					"/specific/doctor/clinics/edit/" + clinic_data.id
					:
					"/specific/doctor/clinics/view/" + clinic_data.id
				)}
			/>
		);
	}
	
	return (
		<div>
			<div className="headerbar">
				<h2>Clinics</h2> <Button label="+" link="/specific/doctor/clinics/create" />
			</div>
			{clinics_list}
		</div>
	);
}

function CreateProfile({user, setDoctor}) {
	return (
		<div className="center">
			<h2>Would you like to register as a doctor?</h2>
			<div className="panel">
				<Button action={() => {window.history.back()}} label="No" />
				<Button type="okay" action={() => {
					createDoctor({user: user}).then(response => {
						if (response.data.doctor) {
							getDoctor({id: response.data.doctor}).then(results => {
								setDoctor(results.data);
							});
						}
					});
				}} label="Yes" />
			</div>
		</div>
	);
}

function Loading() {
	return (
		<h2>Loading...</h2>
	);
}

export function DoctorEditor() {
	const auth = useAuth();
	const [redirect, setRedirect] = useState(false);

	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!status) setRedirect(true);
		});

		return unsubscribe;
	}, [auth]);

	const [mode, setMode] = useState("loading");
	const [doctor, setDoctor] = useState(null);
	const [clinics, setClinics] = useState([]);

	useEffect(() => {
		if (auth.user) {
			db.collection("users").doc(auth.user.uid).get().then(user_snap => {
				if (user_snap.data().doctor) {
					getDoctor({id: user_snap.data().doctor}).then(results => {
						setDoctor(results.data);
						setMode("edit");
					});
				}
				else {
					setMode("create");
				}
			})
		}
	}, [auth]);

	useEffect(() => {
		if (doctor) {
			getAllClinics({doctor: doctor.doctor.id}).then(results => {setClinics(results.data);});
		}
	}, [doctor]);

	let display;

	switch (mode) {
		case "create":
			display = <CreateProfile user={auth.user.uid} setDoctor={doctor => {
				setDoctor(doctor);
				setMode("edit");
			}} />;
			break;
		case "edit":
			display = <ClinicList doctor={doctor ? doctor.doctor.id : null} clinics={clinics} />;
			break;
		default:
			display = <Loading />;
			break;
	}

	return (
		<div className="page">
			{redirect ? <Redirect to="/general/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="content">
				<div>
					<h1>Doctor Profile</h1>
					{display}
				</div>
			</div>
		</div>
	);
}