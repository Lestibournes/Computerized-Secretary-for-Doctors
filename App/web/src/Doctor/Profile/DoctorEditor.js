//Reactjs:
import { MainHeader, useAuth } from "../../Common/CommonComponents";
import { Redirect } from 'react-router-dom';
import { useEffect, useState } from "react";
import { db, fn } from "../../init";

import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput } from "../../Common/CommonComponents";
import { Link } from 'react-router-dom';

import { Card } from "../../Common/Components/Card"

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

const getDoctor = fn.httpsCallable("getDoctor");
const createDoctor = fn.httpsCallable("createDoctor");

/**
 * 
 * @param {string} id the id of the requested clinic.
 * @returns the data of the requested clinic.
 */
async function getClinic(id) {
	let clinic;

	await db.collection("clinics").doc(id).get().then(snap => {
		clinic = snap.data();
		clinic.id = snap.id;
	});

	return clinic;
}

/**
 * 
 * @param {string} id the id of the doctor
 * @returns {object[]} an array of the data of all the clinics the doctor works in.
 */
async function getClinics(id) {
	const clinic_data = [];

	let clinic_ids = [];
	await db.collection("doctors").doc(id).get().then(doctor_snap => {
		clinic_ids = doctor_snap.data().clinics;
	});

	for (let clinic_id of clinic_ids) {
		await db.collection("clinics").doc(clinic_id).get().then(clinic_snap => {
			const clinic = clinic_snap.data();
			clinic.id = clinic_snap.id;

			clinic_data.push(clinic);
		});
	}

	return clinic_data;
}

async function addClinic(doctor, name, city, address) {
	let clinics = [];
	
	await db.collection("doctors").doc(doctor).get().then(doctor_snap => {
		if (doctor_snap.data().clinics) {
			clinics = doctor_snap.data().clinics;
		}
	});

	await db.collection("clinics").add({
		doctors: [doctor],
		name: name,
		city: city,
		address: address,
		owner: doctor
	}).then(clinicRef => {
		clinics.push(clinicRef.id);
	});

	await db.collection("doctors").doc(doctor).update({
		clinics: clinics
	});
}

async function editClinic(id, doctor, name, city, address) {
	const response = {
		success: false,
		message: ""
	};

	let owner;

	await db.collection("clinics").doc(id).get().then(clinic_snap => {
		owner = clinic_snap.data().owner;
	});

	if (owner === doctor) {
		await db.collection("clinics").doc(id).update({
			name: name,
			city: city,
			address: address
		});

		response.success = true;
	}
	else {
		response.message = "It's not your clinic.";
	}

	return response;
}

async function leaveClinic(clinic, doctor) {
	
	// Remove the doctor from the clinic:
	
	let old_doctors = [];
	let new_doctors = [];
	let update = false;
	
	await db.collection("clinics").doc(clinic).get().then(clinic_snap => {
		old_doctors = clinic_snap.data().doctors;
	});
	
	for (let i = 0; i < old_doctors.length; i++) {
		if (old_doctors[i] !== doctor) {
			new_doctors.push(old_doctors[i]);
		}
		else {
			update = true;
		}
	}

	if (update) {
		await db.collection("clinics").doc(clinic).update({
			doctors: new_doctors
		});
	}

	update = false;

	// Remove the clinic from the doctor:

	let old_clinics = [];
	let new_clinics = [];
	
	await db.collection("doctors").doc(doctor).get().then(doctor_snap => {
		old_clinics = doctor_snap.data().clinics
	});
	for (let i = 0; i < old_clinics.length; i++) {
		if (old_clinics[i] !== clinic) {
			new_clinics.push(old_clinics[i]);
		}
		else {
			update = true;
		}
	}
	
	if (update) {
		await db.collection("doctors").doc(doctor).update({
			clinics: new_clinics
		});
	}
}

export function DoctorEditor() {
	const auth = useAuth();
	const [mode, setMode] = useState("loading");
	const [doctor, setDoctor] = useState(null);
	const [clinics, setClinics] = useState([]);
	const [clinic, setClinic] = useState(null);
	const [message, setMessage] = useState("");

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
									setDoctor(results.data);
									setMode("edit");
								});
							}
							else {
								setMessage("Failed to create/load doctor profile.");
								setMode("error");
							}
						});
					}}>Yes</button>
				</div>
			</div>
		);
	}

	function Leave() {
		return (
			<div className="center">
				<h2>Are you sure you wish to leave {clinic.name + " (" + clinic.city + ")"}?</h2>
				<div className="panel">
					<button className="warning" onClick={() => {window.history.back()}}>No</button>
					<button className="okay" onClick={() => {
						leaveClinic(clinic.id, doctor.doctor.id);
						getClinics(doctor.doctor.id).then(clinics => setClinics(clinics));
						setMode("edit");
					}}>Yes</button>
				</div>
			</div>
		);
	}

	function Edit() {
		const clinics_list = [];
		
		for (let clinic_data of clinics) {
			clinics_list.push(
				<Card
					title={clinic_data.name}
					body={clinic_data.city}
					footer={clinic_data.address}
					link={(
						clinic_data.owner === doctor.doctor.id ?
						"/specific/doctor/clinics/edit/" + clinic_data.id
						:
						"/specific/doctor/clinics/view/" + clinic_data.id
					)}
				/>
			);
			// clinics_list.push(
			// 	<li>
			// 		{clinic_data.name + " (" + clinic_data.city + ")"}
			// 		{(clinic_data.owner === doctor.doctor.id ?
			// 			<button onClick={() => {
			// 				setClinic(clinic_data);
			// 				setMode("edit clinic")
			// 			}}>Edit</button>
			// 			:
			// 			<button onClick={() => {
			// 					setClinic(clinic_data);
			// 					setMode("leave clinic")
			// 			}}>Leave</button>
			// 		)}
			// 	</li>
			// )
		}


		
		return (
			<div className="center">
				{doctor ? doctor.user.firstName : null}
				<h3>Clinics <button onClick={() => setMode("add clinic")}>+</button></h3>
				{clinics_list}
			</div>
		);
	}

	function EditClinic(props) {
		const operation = props.id ? "edit" : "create";
		
		return (
			<div className="center">
				<div className="form">
					<h2>{operation === "edit" ? "Edit Clinic" : "Add Clinic"}</h2>
					<Formik
						initialValues={{
							name: props.name,
							city: props.city,
							address: props.address
						}}
						validationSchema={Yup.object({
							name: Yup.string()
								.required("Required"),
							city: Yup.string()
								.required("Required"),
							address: Yup.string()
								.required("Required")
						})}
						onSubmit={async (values, { setSubmitting }) => {
							setSubmitting(true);

							if (operation === "create") {
								addClinic(doctor.doctor.id, values.name, values.city, values.address).then(() => {
									getClinics(doctor.doctor.id).then(clinics => setClinics(clinics));
									setMode("edit");
								});
							}
							else {
								editClinic(props.id, doctor.doctor.id, values.name, values.city, values.address).then(response => {
									if (response.success) {
										getClinics(doctor.doctor.id).then(clinics => setClinics(clinics));
										setMode("edit");
									}
									else {
										setMessage(response.message);
										setMode("error");
									}
								})
							}
						}}
					>
						<Form>
							<TextInput
								label="Name"
								name="name"
								type="text"
								placeholder="Edena"
							/>
							<TextInput
								label="City"
								name="city"
								type="text"
								placeholder="Jerusalem"
							/>
							<TextInput
								label="Address"
								name="address"
								type="text"
								placeholder="13 Main St."
							/>
							<div className="panel">
								<button className="warning" onClick={() => setMode("edit")}>Cancel</button>
								<button className="okay" type="submit">Save</button>
							</div>
						</Form>
					</Formik>
				</div>
			</div>
		);
	}
	
	function Loading() {
		return (
			<div>Loading...</div>
		);
	}

	function Error() {
		return (
			<div>{message}</div>
		);
	}

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
	}, [auth.user]);

	useEffect(() => {
		if (doctor) {
			getClinics(doctor.doctor.id).then(clinics => setClinics(clinics));
		}
	}, [doctor]);

	let display;

	switch (mode) {
		case "error":
			display = <Error />;
			break;
		case "create":
			display = <Create />;
			break;
		case "edit":
			display = <Edit />;
			break;
		case "add clinic":
			display = <EditClinic />;
			break;
		case "edit clinic":
			display = <EditClinic {...clinic} />;
			break;
		case "leave clinic":
			display = <Leave />;
			break;
		default:
			display = <Loading />;
			break;
	}

	return (
		<div className="page">
			{!auth.user ? <Redirect to="/general/login" /> : null }
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