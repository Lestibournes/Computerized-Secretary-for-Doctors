//Reactjs:
import { MainHeader, useAuth } from "../../Common/CommonComponents";
import { Redirect } from 'react-router-dom';
import { useEffect, useState } from "react";
import { db, fn } from "../../init";

const getDoctor = fn.httpsCallable("getDoctor");

async function getClinic(id) {
	let clinic;

	await db.collection("clinics").doc(id).get().then(snap => {
		clinic = snap.data();
		clinic.id = snap.id;
	});

	return clinic;
}

/**
 * @todo
 * I want to have the appointment set for the doctor and the clinic together,
 * so the search page should perhaps show a separate result for every doctor+
 * clinic combination.
 * Show the information about the doctor so that the user can see that the
 * appointment is being set for the correct doctor.
 * Show widgets for selecting appoingment type, date, and time. They should
 * only show what's available. What isn't available should be greyed out.
 * The server side should make the determination in order to protect patient
 * privacy, and also the server side should handle the setting of the
 * appointment, making sure that it's valid.
 */
export function DoctorEditor(props) {
	const auth = useAuth();
	const [loading, setLoading] = useState(true);
	const [doctor, setDoctor] = useState(null);
	const [clinics, setClinics] = useState([]);
	
	const displays = {
		create:
			<div className="center">
				<h2>Would you like to create a doctor profile?</h2>
				<div className="panel">
					<button className="warning" onClick={() => alert("Send me back!")}>No</button>
					<button className="okay" onClick={() => {
						db.collection("doctors").add({
							user: auth.user.uid,
							approved: false
						}).then(doctor_snap => {
							db.collection("users").doc(auth.user.uid).update({
								doctor: doctor_snap.id
							}).then(user_snap => {
								setDoctor(doctor_snap.id);
							});
						});
					}}>Yes</button>
				</div>
			</div>,
		edit:
			<div className="center">
				{doctor ? doctor.user.firstName : null}
			</div>,
	};

	useEffect(() => {
		if (auth.user) {
			db.collection("users").doc(auth.user.uid).get().then(user_snap => {
				if (user_snap.data().doctor) {
					getDoctor({id: user_snap.data().doctor}).then(results => {
						setDoctor(results.data);
					});
					// let clinics = [];

					// user_snap.data().clinics.forEach(clinic_id => {
					// 	clinics.push(getClinic(clinic_id));
					// });

					// setClinics(clinics);

					//get doctor data.
				}

				setLoading(false);
			})
		}
	}, [auth.user]);

	let display = <div>Loading...</div>;

	if (!loading) {
		if (doctor) {
			display = displays.edit;
		}
		if (!doctor) {
			display = displays.create;
		}
	}

	return (
		<div className="page">
			{!auth.user ? <Redirect to="/login" /> : null }
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