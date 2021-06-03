import { useAuth } from "../../../Common/Auth";
import { useEffect, useState } from "react";

import { Card } from "../../../Common/Components/Card";
import { Button } from "../../../Common/Components/Button";

import { Page, usePopups } from "../../../Common/Components/Page";
import { clinicCreatePopup } from "./ClinicCreateForm";
import { createProfilePopup } from "./CreateProfile";
import { capitalizeAll, getPictureURL } from "../../../Common/functions";
import { selectSpecializationPopup, removeSpecializationPopup } from "./SelectSpecialization";
import { server } from "../../../Common/server";
import { UserDetails } from "../../../User/UserDetails";

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

export function DoctorEditor() {
	const auth = useAuth();
	const popupManager = usePopups();

	useEffect(() => {
		popupManager.clear();
	}, []);

	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (auth.user) loadData(auth.user.uid);
		});

		return unsubscribe;
	}, [auth]);

	async function loadData(user) {
		return server.doctors.getID({user: user}).then(response => {
			if (response.data) {
				return server.doctors.getData({id: response.data}).then(results => {
					return setDoctor(results.data);
				});
			}
			else {
				createProfilePopup(
					popupManager,
					auth.user.uid,
					doctor => {
						server.doctors.getData({id: doctor}).then(results => {
							setDoctor(results.data);
						});
					}
				);
			}
		});
	}

	const [doctor, setDoctor] = useState(null);
	const [image, setImage] = useState(null);
	const [clinicCards, setClinicCards] = useState(null);
	const [clinics, setClinics] = useState();

	useEffect(() => {
		if (doctor) {
			setClinics(doctor.clinics);

			getPictureURL(doctor.user.id).then(url => {
				setImage(url);
			});
		}
	}, [doctor]);

	useEffect(() => {
		if (clinics && doctor) {
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

			setClinicCards(clinics_list);
		}
	}, [doctor, clinics]);

	let display;

	if (doctor && clinicCards) {
		display = (
			<>
				<h2>Doctor Profile</h2>
				<section>
					<header>
						<h3>Specializations</h3>
						<Button label="+"
							action={() => {
								selectSpecializationPopup(
									popupManager,
									doctor.fields,
									specialization => {
										server.doctors.addSpecialization({doctor: doctor.doctor.id, specialization: specialization})
										.then(() => {
											loadData(auth.user.uid);
										});
									}
								);
							}}
						/>
					</header>
					<div class="item-list">
						{
							doctor.fields.length > 0 ?
								doctor.fields.map(field => 
								<div
									key={field.id}
									className="removable-item"
								>
									<Button
										label="-"
										action={() => removeSpecializationPopup(popupManager, doctor.doctor.id, field.id, () => loadData(doctor.user.id))}
									/>
									<span>{capitalizeAll(field.id)}</span>
								</div>)
								:
								"No specializations specified"
						}
					</div>
				</section>
				<section>
					<header>
						<h3>Clinics</h3> <Button label="+" action={() => {
							clinicCreatePopup(
								popupManager,
								doctor.doctor.id, 
								clinic_id => {
									server.clinics.get({id: clinic_id}).then(response => {
										const new_clinics = [...clinics];
										new_clinics.push(response.data);
										setClinics(new_clinics);
									});
								}
							);
						}} />
					</header>
					<div className="cardList">
						{clinicCards}
					</div>
				</section>
			</>
		);
	}

	return display ? display : "";
}