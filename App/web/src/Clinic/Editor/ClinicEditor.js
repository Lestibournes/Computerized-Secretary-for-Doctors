//Reactjs:
import React, { useEffect, useState } from 'react';
import { Link, Redirect, useParams } from 'react-router-dom';
import { Button } from "../../Common/Components/Button";
import { Card } from "../../Common/Components/Card"
import { ClinicEditForm } from "./ClinicEditForm";
import { SelectDoctorForm } from "./SelectDoctor";
import { getPictureURL } from "../../Common/functions";
import { SelectSecretaryForm } from './SelectSecretary';
import { usePopups } from '../../Common/Popups';
import { LinkEditForm, LINK_TYPES } from "../../Landing/LinkEdit";
import { Header } from '../../Common/Components/Header';
import { Loading } from '../../Common/Components/Loading';
import { useRoot } from '../../Common/Root';
import { Popup } from '../../Common/Components/Popup';
import { db } from '../../init';
import { Strings } from '../../Common/Classes/strings';
/**
@todo
Edit clinic page:
Can either be used to create a new clinic or edit an existing one. For an existing clinic it will show:
* Options to modify the name and location.
* A list of current members with the option to boot them.
* A list of pending membership requests with the option to accept or reject them.
* A button to go to a search page to find existing doctors and invite them to join the clinic.
*/

export function ClinicEditor() {
	// Contexts:
	const root = useRoot();
	const popups = usePopups();

	// Parameters:
	const { clinic } = useParams(); //The ID of clinic.

	// Components runtime data (states):
	const [clinicData, setClinicData] = useState(null); // The data of the clinic
	const [linkData, setLinkData] = useState();

	const [doctorsData, setDoctorsData] = useState();
	const [doctorCards, setDoctorCards] = useState();
	
	const [secretariesData, setSecretariesData] = useState();
	const [secretaryCards, setSecretaryCards] = useState();

	const [redirect, setRedirect] = useState(null);

	// Get clinic data:
	useEffect(() => {
		if (clinic) {
			return db.collection("clinics").doc(clinic).onSnapshot(
				clinic_snap => {
					if (clinic_snap.exists) {
						const data = clinic_snap.data();
						data.id = clinic_snap.id;
						setClinicData(data);
					}
				},
				error => popups.error(error.message)
			);
		}
	}, [clinic]);

	// Get clinic link:
	useEffect(() => {
		if (clinic) {
			return db.collection("links").where("type", "==", "clinic").where("id", "==", clinic).onSnapshot(
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
	}, [clinic]);

	// Get the doctors' data with their specializations:
	useEffect(() => {
		if (clinic) {
			return db.collection("clinics").doc(clinic).collection("doctors").onSnapshot(
				doctor_snaps => {
					const promises = [];

					for (const doctor_snap of doctor_snaps.docChanges()) {
						promises.push(
							db.collection("users").doc(doctor_snap.doc.id).get()
							.then(user_snap => {
								const data = user_snap.data();
								data.id = user_snap.id;

								return db.collection("users").doc(user_snap.id).collection("specializations").get()
								.then(spec_snaps => {
									data.specializations = [];

									for (const spec_snap of spec_snaps.docs) {
										const spec_data = spec_snap.data();
										spec_data.id = spec_snap.id;
										data.specializations.push(spec_data);
									}

									return data;
								});
							})
							.catch(reason => popups.error(reason.message))
						);
					}

					Promise.all(promises).then(user_data => {
						user_data.sort(
							(a, b) => {
								if (a.lastName > b.lastName) return 1;
								if (a.lastName < b.lastName) return -1;

								if (a.firstName > b.firstName) return 1;
								if (a.firstName < b.firstName) return -1;

								return 0;
							}
						);

						setDoctorsData(user_data);
					})
				},
				error => popups.error(error.message)
			);
		}
	}, [clinic]);

	// Get the secretaries' data:
	useEffect(() => {
		if (clinic) {
			return db.collection("clinics").doc(clinic).collection("secretaries").onSnapshot(
				secretary_snaps => {
					const promises = [];

					for (const secretary_snap of secretary_snaps.docs) {
						promises.push(
							db.collection("users").doc(secretary_snap.id).get()
							.then(user_snap => {
								const data = user_snap.data();
								data.id = user_snap.id;
								return data;
							})
							.catch(reason => popups.error(reason))
						);
					}
					
					Promise.all(promises).then(secretaries_data => {
						secretaries_data.sort(
							(a, b) => {
								if (a.lastName > b.lastName) return 1;
								if (a.lastName < b.lastName) return -1;
								
								if (a.firstName > b.firstName) return 1;
								if (a.firstName < b.firstName) return -1;

								return 0;
							}
						);

						setSecretariesData(secretaries_data);
					})
				},
				error => popups.error(error.message)
			);
		}
	}, [clinic]);

	// Generate the doctor list:
	useEffect(() => {
		if (doctorsData) {
			const promises = [];

			for (const doctor of doctorsData) {
				promises.push(
					getPictureURL(doctor.id).then(url => {
						const card = 
							<Card
								key={doctor.id}
								title={doctor.fullName + (doctor.id === clinicData.owner ? " (♚ owner)" : "")}
								body=
									{doctor.specializations.length > 0 ?
										doctor.specializations.map((specialization, index) => specialization.id + (index < doctor.specializations.length - 1 ? ", "
										: ""))
									: Strings.instance.get(142)}
								image={url}
								link={root.get() + "/clinics/schedule/edit/" + clinic + "/" + doctor.id}
							/>;
		
						return {
							data: doctor,
							component: card
						};
					})
				);
			}

			Promise.all(promises).then(cards => {
				cards.sort((a, b) => {
					if (a.data.id === clinicData.owner) return 1;
					if (b.data.id === clinicData.owner) return -1;
	
					if (a.data.lastName > b.data.lastName) return 1;
					if (a.data.lastName < b.data.lastName) return 1;

					if (a.data.firstName > b.data.firstName) return 1;
					if (a.data.firstName < b.data.firstName) return 1;

					return 0;
				});
				
				setDoctorCards(cards.map(card => card.component));
			});
		}
	}, [doctorsData, clinicData, clinic]);

	// Generate the secretary list:
	useEffect(() => {
		if (secretariesData) {
			const promises = [];

			for (const secretary of secretariesData) {
				promises.push(
					getPictureURL(secretary.id).then(url => {
						const card = (<Card
							key={secretary.id}
							title={secretary.fullName}
							image={url}
							link={root.get() + "/clinics/secretary/edit/" + clinic + "/" + secretary.id}
						/>);
		
						return {
							data: secretary,
							component: card
						};
					})
				);
			}

			Promise.all(promises).then(cards => {
				cards.sort((a, b) => {
					if (a.data.id === clinicData.owner) return 1;
					if (b.data.id === clinicData.owner) return -1;
	
					if (a.data.lastName > b.data.lastName) return 1;
					if (a.data.lastName < b.data.lastName) return 1;

					if (a.data.firstName > b.data.firstName) return 1;
					if (a.data.firstName < b.data.firstName) return 1;

					return 0;
				});
				
				setSecretaryCards(cards.map(card => card.component));
			});
		}
	}, [secretariesData, clinicData, clinic]);

	let display = <Loading />;
	if (clinicData && doctorCards && secretaryCards) {
		display = (
			<>
				{redirect ? <Redirect to={root.get() + redirect} /> : ""}

				{/* Clinic data: */}
				<section>
					<header>
						<h2>{Strings.instance.get(112)}</h2>
						<Button label={Strings.instance.get(57)}
							action={() => {
								const close = () => {popups.remove(popup)};

								const popup =
									<Popup key="Edit Clinic Details" title={Strings.instance.get(174)} close={close}>
										<ClinicEditForm
											clinic={clinicData}
											close={close}
											deleted={() => setRedirect("/user/profile/doctor")}
										/>
									</Popup>;
									
								popups.add(popup);
							}}
						/>
					</header>
						<div className="table">
							<b>{Strings.instance.get(66)}:</b> <span>{clinicData.name}</span>
							<b>{Strings.instance.get(146)}:</b> <span>{clinicData.city}, {clinicData.address}</span>
						</div>
				</section>

				{/* Clinic direct link: */}
				<section>
					<header>
						<h2>{Strings.instance.get(120)}</h2>
						<Button label={Strings.instance.get(57)}
							action={() => {
								const close = () => popups.remove(popup);

								const popup =
									<Popup key={"Edit Link"} title={Strings.instance.get(121)} close={close}>
										<LinkEditForm
											link={linkData?.name}
											type={LINK_TYPES.CLINIC}
											id={clinic}
											close={close}
										/>
									</Popup>

								popups.add(popup);
							}}
						/>
					</header>
					{linkData ?
						<div className="table">
							<><b>{Strings.instance.get(66)}:</b> <Link to={"/" + linkData.name} >{linkData.name}</Link></>
						</div>
						:
						<div>
							<p>
							{Strings.instance.get(126)}
							</p>
							<p>
							{Strings.instance.get(128)}
							</p>
						</div>
					}
				</section>

				{/* Doctor list: */}
				<section>
					<header>
						<h2>{Strings.instance.get(177)}</h2>
						<Button label="+"
							action={() => {
								const close = () => {popups.remove(popup)};

								const popup =
									<Popup key="Add Doctor" title={Strings.instance.get(178)} close={close}>
										<SelectDoctorForm clinic={clinicData} close={close} />
									</Popup>;

								popups.add(popup);
							}} />
					</header>
					<div className="cardList">
						{doctorCards}
					</div>
				</section>

				{/* Secretary list: */}
				<section>
					<header>
						<h2>{Strings.instance.get(180)}</h2>
						<Button label="+"
							action={() => {
								const close = () => {popups.remove(popup)};
								
								const popup =
									<Popup key="Add Secretary" title={Strings.instance.get(182)} close={close}>
										<SelectSecretaryForm
											clinic={clinic}
											close={close}
											success={
												selected => {
													db.collection("clinics").doc(clinic).collection("secretaries").doc(selected).set({
														user: selected,
														clinic: clinic
													}).catch(reason => popups.error(reason.code));
												}
											}
										/>
									</Popup>;
								
								popups.add(popup);
							}} />
					</header>
					<div className="cardList">
						{secretaryCards}
					</div>
				</section>
			</>
		);
	}

	return (
		<div className="Page">
			<Header />
			<h1>{Strings.instance.get(184)}</h1>
			<main>
				{display}
			</main>
		</div>
	);

}