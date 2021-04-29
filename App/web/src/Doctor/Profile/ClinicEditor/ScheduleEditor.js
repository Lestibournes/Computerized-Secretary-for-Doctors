import "./ClinicEditor.css"
//Reactjs:
import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../Common/Auth";
import { Redirect, useParams } from 'react-router-dom';
import { fn } from '../../../init';
import { Button } from "../../../Common/Components/Button";
import { Card } from "../../../Common/Components/Card"
import { Page } from "../../../Common/Components/Page";
import { ClinicEditForm } from "./ClinicEditForm";
import { getPictureURL } from "../../../Common/functions";

const getClinic = fn.httpsCallable("clinics-get");

const getDoctor = fn.httpsCallable("doctors-getData");
const getDoctorID = fn.httpsCallable("doctors-getID");
const getAllDoctors = fn.httpsCallable("clinics-getAllDoctors");

/**
@todo
Edit clinic page:
Can either be used to create a new clinic or edit an existing one. For an existing clinic it will show:
* Options to modify the name and location.
* A list of current members with the option to boot them.
* A list of pending membership requests with the option to accept or reject them.
* A button to go to a search page to find existing doctors and invite them to join the clinic.
*/

export function ScheduleEditor() {
	const auth = useAuth();
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (auth.user) {
				getDoctorID({user: auth.user.uid}).then(response => {
					getDoctor({id: response.data}).then(doctor_data => {
						setDoctorData(doctor_data.data);
					});
				});
			}
		});

		return unsubscribe;
	}, [auth]);

	const { clinic, doctor } = useParams(); //The ID of clinic and doctor

	const [clinicData, setClinicData] = useState(null);
	const [doctorData, setDoctorData] = useState(null);
	
	const [redirect, setRedirect] = useState(null); //Where to redirect to in case the doctor is removed from the clinic.

	const [addShift, setAddShift] = useState(false);
	const [sunday, setSunday] = useState();
	const [monday, setMonday] = useState();
	const [tuesday, setTuesday] = useState();
	const [wednesday, setWednesday] = useState();
	const [thursday, setThursday] = useState();
	const [friday, setFriday] = useState();
	const [saturday, setSaturday] = useState();

	useEffect(() => {
		if (clinic) {
			getClinic({id: clinic}).then(clinic_data => {
				setClinicData(clinic_data.data);
			});
		}
	}, [clinic]);

	let display = <h2>Loading...</h2>;
	const popups = 
	<>
	</>;
	
	if (clinicData && doctorData /* && results.length */) {
		display = (
			<>
				{redirect ? <Redirect to={redirect} /> : ""}
				<div className="table">
					<b>Clinic:</b> <span>{clinicData.name}</span>
					<b>Doctor:</b> <span>{doctorData.user.fullName}</span>
				</div>

				<div className="headerbar">
					<h2>Sunday</h2> <Button label="+" action={() => addShift(0)} />
				</div>
				<div className="cardList">
					{sunday}
				</div>

				<div className="headerbar">
					<h2>Monday</h2> <Button label="+" action={() => addShift(1)} />
				</div>
				<div className="cardList">
					{monday}
				</div>

				<div className="headerbar">
					<h2>Tuesday</h2> <Button label="+" action={() => addShift(2)} />
				</div>
				<div className="cardList">
					{tuesday}
				</div>

				<div className="headerbar">
					<h2>Wednesday</h2> <Button label="+" action={() => addShift(3)} />
				</div>
				<div className="cardList">
					{wednesday}
				</div>

				<div className="headerbar">
					<h2>Thursday</h2> <Button label="+" action={() => addShift(4)} />
				</div>
				<div className="cardList">
					{thursday}
				</div>

				<div className="headerbar">
					<h2>Friday</h2> <Button label="+" action={() => addShift(5)} />
				</div>
				<div className="cardList">
					{friday}
				</div>

				<div className="headerbar">
					<h2>Saturday</h2> <Button label="+" action={() => addShift(6)} />
				</div>
				<div className="cardList">
					{saturday}
				</div>
			</>
		);
	}

	return (
		<Page
			title={"Edit Schedule"}
			content={
				<>
					{display}
					{popups}
				</>
			}
		/>
	);
}