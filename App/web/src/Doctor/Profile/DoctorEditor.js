import "./DoctorEditor.css";
import { useAuth } from "../../Common/CommonComponents";
import { Redirect } from 'react-router-dom';
import { useEffect, useState } from "react";
import { db, fn } from "../../init";

import { Card } from "../../Common/Components/Card";
import { Button } from "../../Common/Components/Button";
import { Popup } from "../../Common/Components/Popup";

import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput } from '../../Common/Components/TextInput';
import { MainHeader } from "../../Common/Components/MainHeader";

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
const addClinic = fn.httpsCallable("clinics-add");

function ClinicCreateForm({doctor, close, success}) {
	return (
		<div className="form">
			<Formik
				initialValues={{
					name: "",
					city: "",
					address: ""
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

					addClinic({doctor: doctor, name: values.name, city: values.city, address: values.address})
					.then(response => {
							success(response);
							close();
					});
				}}
			>
				<Form>
					<TextInput
						label="Clinic Name"
						name="name"
						type="text"
						placeholder="Eden"
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
						placeholder="13 Holy Square"
					/>
					<div className="panel">
						<Button label="Cancel" action={close} />
						<Button type="submit" label="Save" />
					</div>
				</Form>
			</Formik>
		</div>
	);
}

function CreateProfile({user, success, failure, close}) {
	return (
		<div className="center">
			<h2>Would you like to register as a doctor?</h2>
			<div className="panel">
				<Button action={close} label="No" />
				<Button type="okay" action={() => {
					createDoctor({user: user}).then(response => {
						if (response.data.success) success(response.data.doctor);
						else failure();
					});
				}} label="Yes" />
			</div>
		</div>
	);
}

export function DoctorEditor() {
	const auth = useAuth();
	const [redirect, setRedirect] = useState(false);

	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!status) setRedirect(true);
			else if (auth.user) {
				db.collection("users").doc(auth.user.uid).get().then(user_snap => {
					if (user_snap.data().doctor) {
						getDoctor({id: user_snap.data().doctor}).then(results => {
							setDoctor(results.data);
						});
					}
					else {
						setCreateProfile(true);
					}
				});
			}
		});

		return unsubscribe;
	}, [auth]);

	const [doctor, setDoctor] = useState(null);
	const [clinics, setClinics] = useState(null);
	const [createProfile, setCreateProfile] = useState(false);
	const [alreadyExists, setAlreadyExists] = useState(false);
	const [createClinic, setCreateClinic] = useState(false);

	useEffect(() => {
		if (doctor) {
			getAllClinics({doctor: doctor.doctor.id}).then(results => {setClinics(results.data);});
		}
	}, [doctor]);

	let display = <h2>Loading...</h2>;

	if (clinics) {
		const clinics_list = [];
	
		for (let clinic_data of clinics) {
			clinics_list.push(
				<Card
					key={clinic_data.id}
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
		}
		
		display = (
			<>
				<div className="headerbar">
					<h2>Clinics</h2> <Button label="+" action={() => setCreateClinic(true)} />
				</div>
				<div className="cardList">
					{clinics_list}
				</div>
			</>
		);
	}

	return (
		<>
			{redirect ? <Redirect to="/general/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<h1>Doctor Profile</h1>
			{createProfile && auth.user ? <Popup
				title="Create Profile"
				display={
				<CreateProfile
					user={auth.user.uid}
					success={doctor => {
						setCreateProfile(false);
						getDoctor({id: doctor}).then(results => {
							setDoctor(doctor);
						});
					}}
					failure={() => setAlreadyExists(true)}
					close={() => {window.history.back()}}
				/>}
				close={() => {window.history.back()}}
			/> : ""}
			{alreadyExists ? <Popup
				title="Info"
				display={
					<div>You already have a doctor profile</div>
				}
				close={() => {
					setAlreadyExists(false);
					setCreateProfile(false);
				}}
			/> : ""}
			{createClinic ? 
			<Popup 
				title="Create New Clinic"
				display={<ClinicCreateForm
					doctor={doctor.doctor.id}
					success={clinic => {
						setCreateClinic(false);
						getAllClinics({doctor: doctor.doctor.id}).then(results => {setClinics(results.data);});
					}}
					close={() => setCreateClinic(false)}
				/>}
				close={() => setCreateClinic(false)}
			/>
			: ""}
			{display}
		</>
	);
}