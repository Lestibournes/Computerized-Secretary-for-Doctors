//Reactjs:
import { MainHeader, useAuth } from "../../Common/CommonComponents";
import { Redirect } from 'react-router-dom';
import { useEffect, useState } from "react";
import { db, fn } from "../../init";

const getDoctor = fn.httpsCallable("getDoctor");
const createDoctor = fn.httpsCallable("createDoctor");

async function getClinic(id) {
	let clinic;

	await db.collection("clinics").doc(id).get().then(snap => {
		clinic = snap.data();
		clinic.id = snap.id;
	});

	return clinic;
}

export function DoctorEditor(props) {
	const auth = useAuth();
	const [doctor, setDoctor] = useState(null);
	const [display, setDisplay] = useState(<Loading />);

	function Create() {
		return (
			<div className="center">
				<h2>Would you like to create a doctor profile?</h2>
				<div className="panel">
					<button className="warning" onClick={() => {window.history.back()}}>No</button>
					<button className="okay" onClick={() => {
						createDoctor({user: auth.user.uid}).then(response => {
							if (response.data.doctor) {
								getDoctor({id: response.data.doctor}).then(results => {
									setDisplay(<Edit doctor={results.data} />);
									setDoctor(results.data);
								});
							}
							else {
								alert("Failed to create/load doctor profile.");
							}
						});
					}}>Yes</button>
				</div>
			</div>
		);
	}

	function Edit(props) {
		return (
			<div className="center">
				{props.doctor ? props.doctor.user.firstName : null}
			</div>
		);
	}

	function Loading() {
		return (
			<div>Loading...</div>
		);
	}

	useEffect(() => {
		if (auth.user) {
			db.collection("users").doc(auth.user.uid).get().then(user_snap => {
				if (user_snap.data().doctor) {
					getDoctor({id: user_snap.data().doctor}).then(results => {
						setDisplay(<Edit doctor={results.data} />);
						setDoctor(results.data);
					});
				}
				else {
					setDisplay(<Create />);
				}
				
			})
		}
	}, [auth.user]);


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