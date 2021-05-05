import { useAuth } from "../../../Common/Auth";
import { useEffect, useState } from "react";
import { fn } from "../../../init";

import { Card } from "../../../Common/Components/Card";
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";

import { Page } from "../../../Common/Components/Page";
import { ClinicCreateForm } from "./ClinicCreateForm";
import { CreateProfile } from "./CreateProfile";
import { UserEditForm } from "./UserEditForm";
import { capitalize, getPictureURL } from "../../../Common/functions";
import { SelectSpecialization } from "./SelectSpecialization";

const getDoctor = fn.httpsCallable("doctors-getData");
const getDoctorID = fn.httpsCallable("doctors-getID");
const getAllClinics = fn.httpsCallable("doctors-getAllClinics");
const addSpecialization = fn.httpsCallable("doctors-addSpecialization");
const delSpecialization = fn.httpsCallable("doctors-removeSpecialization");

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

function generateClinicCards(doctor, clinics) {
	const clinics_list = [];
		
	for (let clinic_data of clinics) {
		clinics_list.push(
			<Card
				key={clinic_data.id}
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

	return clinics_list;
}

export function DoctorEditor() {
	const auth = useAuth();

	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (auth.user) loadData(auth.user.uid);
		});

		return unsubscribe;
	}, [auth]);

	async function loadData(user) {
		return getDoctorID({user: user}).then(response => {
			if (response.data) {
				return getDoctor({id: response.data}).then(results => {
					return setDoctor(results.data);
				});
			}
			else {
				return setCreateProfile(true);
			}
		});
	}
	const [doctor, setDoctor] = useState(null);
	const [image, setImage] = useState(null);
	const [clinics, setClinics] = useState(null);
	const [createProfile, setCreateProfile] = useState(false);
	const [alreadyExists, setAlreadyExists] = useState(false);
	const [createClinic, setCreateClinic] = useState(false);
	const [editData, setEditData] = useState(false);
	const [selectSpecialization, setSelectSpecializations] = useState(false);
	const [removeSpecialization, setRemoveSpecialization] = useState(false);

	useEffect(() => {
		if (doctor) {
			setClinics(generateClinicCards(doctor.doctor.id, doctor.clinics));

			getPictureURL(doctor.user.id).then(url => {
				setImage(url);
			});
		}
	}, [doctor]);

	let display = <h2>Loading...</h2>;

	if (doctor && clinics) {
		display = (
			<>
				<div className="headerbar">
					<h2>Details</h2> <Button label="Edit" action={() => setEditData(true)} />
				</div>
				<div className="table">
					<b>Photo</b> <img src={image} alt={doctor.user.firstName + " " + doctor.user.lastName} />
					<b>Name:</b> <span>{doctor.user.firstName + " " + doctor.user.lastName}</span>
					<b>Sex:</b> <span>{doctor.user.sex ? doctor.user.sex[0].toLocaleUpperCase() + doctor.user.sex.substr(1).toLowerCase() : "Not specified"}</span>
				</div>
				<div className="headerbar">
					<h2>Specializations</h2> <Button label="+" action={() => setSelectSpecializations(true)} />
				</div>
				<div>
					{
						doctor.fields.length > 0 ?
							doctor.fields.map(field => 
							<div
								key={field.id}
								className="headerbar"
							>
								<span>{capitalize(field.id)}</span>
								<Button
									label="-"
									action={() => {
										setRemoveSpecialization(field.id);
									}}
								/>
							</div>)
							:
							"No specializations specified"
					}
				</div>
				<div className="headerbar">
					<h2>Clinics</h2> <Button label="+" action={() => setCreateClinic(true)} />
				</div>
				<div className="cardList">
					{clinics}
				</div>
			</>
		);
	}

	const popups =
	<>
		{createProfile && auth.user ? <CreateProfile
			user={auth.user.uid}
			success={doctor => {
				setCreateProfile(false);
				getDoctor({id: doctor}).then(results => {
					setDoctor(results.data);
				});
			}}
			failure={() => setAlreadyExists(true)}
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
		<ClinicCreateForm
			doctor={doctor.doctor.id}
			success={() => {
				setCreateClinic(false);
				getAllClinics({doctor: doctor.doctor.id}).then(results => {
					setClinics(generateClinicCards(doctor.doctor.id, results.data));
				});
			}}
			close={() => setCreateClinic(false)}
		/>
		: ""}
		{editData ? 
		<UserEditForm
			user={doctor.user}
			image={image}
			close={() => {
				loadData(auth.user.uid).then(() => setEditData(false));
			}}
		/>
		: ""}
		{selectSpecialization && doctor ? 
		<SelectSpecialization
			specializations={doctor.fields}
			close={() => setSelectSpecializations(false)}
			success={specialization => {
				addSpecialization({doctor: doctor.doctor.id, specialization: specialization})
				.then(() => {
					loadData(auth.user.uid);
				});
			}}
		/>
		: ""}
		{removeSpecialization && doctor ? 
		<Popup
			title="Please Confirm"
			close={() => setRemoveSpecialization(false)}
			display={
				<>
					Are you sure you wish to remove the specialization {capitalize(removeSpecialization)}?
					<div className="buttonBar">
						<Button type="okay" label="Cancel" action={() => setRemoveSpecialization(false)} />
						<Button type="cancel" label="Yes" action={() => {
							delSpecialization({doctor: doctor.doctor.id, specialization: removeSpecialization})
							.then(() => {
								loadData(auth.user.uid).then(() => setRemoveSpecialization(false));
							});
						}} />
					</div>
				</>
			}
		/>
		: ""}
	</>;

	return (
			<Page
				title="Doctor Profile"
				content={<>
					{popups}
					{display}
					</>}
			/>
	);
}