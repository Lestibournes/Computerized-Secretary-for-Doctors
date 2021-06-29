import { useAuth } from "../../Common/Auth";
import { useEffect, useState } from "react";

import { Card } from "../../Common/Components/Card";
import { Button } from "../../Common/Components/Button";

import { ClinicCreateForm, clinicCreatePopup } from "./ClinicCreateForm";
import { createProfilePopup } from "./CreateDoctorProfile";
import { capitalizeAll } from "../../Common/functions";
import { SelectSpecializationForm } from "./SelectSpecialization";
import { usePopups } from "../../Common/Popups";
import { LinkEditForm, LINK_TYPES } from "../../Landing/LinkEdit";
import { Link } from "react-router-dom";
import { useRoot } from "../../Common/Root";
import { Popup } from "../../Common/Components/Popup";
import { Loading } from "../../Common/Components/Loading";
import { db } from "../../init";

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

export function DoctorProfileFragment() {
	const auth = useAuth();
	const popups = usePopups();
	const root = useRoot();

	const [doctor, setDoctor] = useState(null);
	const [specializations, setSpecializations] = useState();
	const [linkData, setLinkData] = useState();

	const [owned, setOwned] = useState();
	const [ownedCards, setOwnedCards] = useState(null);

	const [clinics, setClinics] = useState();
	const [clinicCards, setClinicCards] = useState(null);

	// Load user data:
	useEffect(() => {
		if (auth?.user) {
			return db.collection("users").doc(auth.user.uid).onSnapshot(
				user_snap => {
					const user = user_snap.data();
					user.id = user_snap.id;
	
					if (user.doctor) setDoctor(user);
					else createProfilePopup(popups, auth.user.uid);
				},
				error => popups.error("Error fetching user data: " + error.message)
			)
		}
	}, [auth.user, popups]);

	// Load the data of the clinics owned by this doctor:
	useEffect(() => {
		if (doctor) {
			return db.collection("clinics")
			.where("owner", "==", doctor.id)
			.onSnapshot(
				clinic_snaps => {
					const clinics = [];
					
					for (const clinic_snap of clinic_snaps.docs) {
						if (clinic_snap.exists) {
							const clinic = clinic_snap.data();
							clinic.id = clinic_snap.id;
							clinics.push(clinic)
						}
					}

					setOwned(clinics);
				},
				error => popups.error("Error fetching doctor data: " + error.message)
			)
		}
	}, [doctor]);


	// Get doctor link:
	useEffect(() => {
		if (doctor) {
			return db.collection("links").where("type", "==", "doctor").where("id", "==", doctor.id).onSnapshot(
				link_snaps => {
					for (const link_snap of link_snaps.docs) {
						if (link_snap.exists) {
							const data = link_snap.data();
							data.id = link_snap.id;
							setLinkData(data);
							return;
						}
					}

					setLinkData(null);
				},
				error => popups.error(error.message)
			);
		}
	}, [doctor]);

	// Load the data of the clinics where this doctor works:
	useEffect(() => {
		if (doctor) {
			return db.collectionGroup("doctors")
			.where("user", "==", doctor.id)
			.onSnapshot(
				doctor_snaps => {
					const promises = [];
					
					for (const doctor_snap of doctor_snaps.docs) {
						const clinicRef = doctor_snap.ref.parent.parent;

						if (clinicRef) {
							promises.push(
								clinicRef.get()
								.then(clinic_snap => {
									if (clinic_snap.exists) {
										const clinic = clinic_snap.data();
										clinic.id = clinic_snap.id;
										return clinic;
									}
									
									return null;
								})
								.catch(reason => popups.error("Error fetching clinic data: " + reason))
							)
						}
					}

					Promise.all(promises).then(clinics => setClinics(clinics));
				},
				error => popups.error("Error fetching doctor data: " + error.message)
			)
		}
	}, [doctor]);

	// Load the specializations of this doctor:
	useEffect(() => {
		if (doctor) {
			return db.collection("users").doc(doctor.id).collection("specializations").onSnapshot(
				spec_snaps => {
					const specializations = [];

					for (const spec_snap of spec_snaps.docs) {
						const spec = spec_snap.data();
						spec.id = spec_snap.id;
						specializations.push(spec);
					}

					setSpecializations(specializations);
				},
				error => popups.error("Error fetching specialization data: " + doctor.id + ", " + error.message)
			)
		}
	}, [doctor]);

	// Display the clinics this doctor owns:
	useEffect(() => {
		if (owned && doctor) {
			const clinics_list = [];
			
			for (let clinic_data of owned) {
				if (clinic_data) {
					clinics_list.push(
						<Card
							key={clinic_data.id}
							title={clinic_data.name}
							body={clinic_data.city}
							footer={clinic_data.address}
							link={root.get() + "/clinics/edit/" + clinic_data.id}
						/>
					);
				}
			}

			setOwnedCards(clinics_list);
		}
	}, [doctor, owned, root]);
	
	// Display the clinics where this doctor works:
	useEffect(() => {
		if (clinics && doctor) {
			const clinics_list = [];
			
			for (let clinic_data of clinics) {
				if (clinic_data) {
					clinics_list.push(
						<Card
							key={clinic_data.id}
							title={clinic_data.name}
							body={clinic_data.city}
							footer={clinic_data.address}
							link={root.get() + "/clinics/view/" + clinic_data.id}
						/>
					);
				}
			}

			setClinicCards(clinics_list);
		}
	}, [doctor, clinics, root]);

	let display = <Loading />;

	if (doctor && clinicCards) {
		display = (
			<>
				<h2>Doctor Profile</h2>

				{/* The doctor's direct link: */}
				<section>
					<header>
						<h3>Link</h3>
						<Button label="Edit"
							action={() => {
								const close = () => popups.remove(popup);
							
								const popup =
									<Popup key={"Edit Link"} title={"Edit Link"} close={close}>
										<LinkEditForm
											link={linkData?.name}
											type={LINK_TYPES.DOCTOR}
											id={doctor.id}
											close={close}
										/>
									</Popup>
							
								popups.add(popup);
							}}
						/>
					</header>
						{linkData ?
							<div className="table">
								<b>Name:</b> <Link to={"/" + linkData.name} >{linkData.name}</Link>
							</div>
							:
							<div>
								<p>
									Create a custom direct link to share with your patients.
								</p>
								<p>
									A direct link lets patients make appointments with you directly.
								</p>
							</div>
						}
				</section>

				{/* The doctor's specializations: */}
				<section>
					<header>
						<h3>Specializations</h3>
						<Button label="+"
							action={() => {
								const close = () => {popups.remove(popup)};

								const popup =
									<Popup key="Select Specialization" title="Add Specialization" close={close}>
										<SelectSpecializationForm doctor={doctor.id} close={close} />
									</Popup>;

								popups.add(popup);
							}}
						/>
					</header>
					<div className="item-list">
						{
							specializations?.length > 0 ?
							specializations.map(specialization => 
								<div
									key={specialization.id}
									className="removable-item"
								>
									<Button
										label="-"
										action={() => {
											const close = () => {popups.remove(popup)}

											const popup = 
												<Popup key="Remove Specialization" title="Please Confirm" close={close}>
													<p>
														Are you sure you wish to remove the specialization {capitalizeAll(specialization.id)}?
													</p>
													<div className="buttonBar">
														<Button type="okay" label="Cancel" action={close} />
														<Button
															type="cancel"
															label="Yes"
															action={() => {
																db.collection("users").doc(doctor.id).collection("specializations").doc(specialization.id).delete()
																.then(close)
																.catch(reason => popups.error(reason.message));
															}}
														/>
													</div>
												</Popup>;

											popups.add(popup);
										}}
									/>
									<span>{capitalizeAll(specialization.id)}</span>
								</div>)
								:
								"No specializations specified"
						}
					</div>
				</section>

				{/* The doctor's owned clinics: */}
				<section>
					<header>
						<h3>Clinics I Own</h3>
						<Button
							label="+"
							action={() => {
								const close = () => {popups.remove(popup)};
								const popup =
									<Popup key="Create New Clinic" title="Create New Clinic" close={close}>
										<ClinicCreateForm
											doctor={doctor.id}
											close={close}
										/>
									</Popup>;
									popups.add(popup);
							}}
						/>
					</header>
					<div className="cardList">
						{ownedCards}
					</div>
				</section>

				{/* Other clinics where the doctor works: */}
				<section>
					<header>
						<h3>Clinics Where I Work</h3>
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