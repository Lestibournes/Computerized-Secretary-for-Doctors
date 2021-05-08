//Reactjs:
import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../Common/Auth";
import { Redirect, useParams } from 'react-router-dom';
import { fn } from '../../../init';
import { Button } from "../../../Common/Components/Button";
import { Card } from "../../../Common/Components/Card"
import { Page } from "../../../Common/Components/Page";
import { ClinicEditForm } from "./ClinicEditForm";
import { SelectDoctor } from "./SelectDoctor";
import { getPictureURL } from "../../../Common/functions";
import { SelectSecretary } from './SelectSecretary';

const clinics = {
	get: fn.httpsCallable("clinics-get"),

	getAllDoctors: fn.httpsCallable("clinics-getAllDoctors"),
	addDoctor: fn.httpsCallable("clinics-addDoctor"),

	getAllSecretaries: fn.httpsCallable("clinics-getAllSecretaries"),
	addSecretary: fn.httpsCallable("clinics-addSecretary"),
}

const doctors = {
	getID: fn.httpsCallable("doctors-getID"),
	getData: fn.httpsCallable("doctors-getData"),
}

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
	const auth = useAuth();
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (auth.user) {
				doctors.getID({user: auth.user.uid}).then(response => {
					doctors.getData({id: response.data}).then(doctor_data => {
						setDoctor(doctor_data.data);
					});
				});
			}
		});

		return unsubscribe;
	}, [auth]);

	const { clinic } = useParams(); //The ID of clinic.
	const [data, setData] = useState(null);
	const [doctor, setDoctor] = useState(null);
	const [editData, setEditData] = useState(false);
	
	const [doctorsData, setDoctorsData] = useState();
	const [doctorCards, setDoctorCards] = useState();
	const [showDoctorSelector, setShowDoctorSelector] = useState(false);
	
	const [secretariesData, setSecretariesData] = useState();
	const [secretaryCards, setSecretaryCards] = useState();
	const [showSecretarySelector, setShowSecretarySelector] = useState(false);

	const [redirect, setRedirect] = useState(null);

	useEffect(() => {
		if (clinic) {
			clinics.get({id: clinic}).then(clinic_data => {
				setData(clinic_data.data);

				clinics.getAllDoctors({clinic: clinic}).then(doctors_data => {
					setDoctorsData(doctors_data.data);
				});

				clinics.getAllSecretaries({clinic: clinic}).then(secretaries_data => {
					setSecretariesData(secretaries_data.data);
				});
			});
		}
	}, [clinic]);


	useEffect(() => {
		if (doctorsData) {
			const promises = [];

			for (const doctor of doctorsData) {
				promises.push(getPictureURL(doctor.user.id).then(url => {
					doctor.image = url;

					const card = (<Card
						key={doctor.doctor.id}
						title={doctor.user.firstName + " " + doctor.user.lastName + (doctor.doctor.id === data.owner ? " (♚ owner)" : "")}
						body=
							{doctor.fields.length > 0 ?
								doctor.fields.map((field, index) => field.id + (index < doctor.fields.length - 1 ? ", "
								: ""))
							: "No specializations specified"}
						footer={doctor.clinics.map(clinic => {return clinic.name + ", " + clinic.city + "; "})}
						image={doctor.image}
						link={"/specific/doctor/clinics/schedule/edit/" + clinic + "/" + doctor.doctor.id}
					/>);
	
					return {
						name: doctor.user.lastName + doctor.user.firstName,
						id: doctor.doctor.id,
						component: card
					};
				}));
			}

			Promise.all(promises).then(cards => {
				cards.sort((a, b) => {
					if (a.id === data.owner) {
						return -1;
					};
		
					if (b.id === data.owner) {
						return 1;
					};
	
					if (a.name === b.name) {
						return 0;
					}
					else if (a.name < b.name) {
						return -1;
					}
					else {
						return 1;
					}
				});
				
				setDoctorCards(cards.map(card => card.component));
			});
		}
	}, [doctorsData, data, clinic]);

	useEffect(() => {
		if (secretariesData) {
			const promises = [];

			for (const secretary of secretariesData) {
				promises.push(getPictureURL(secretary.user.id).then(url => {
					secretary.image = url;

					const card = (<Card
						key={secretary.id}
						title={secretary.fullName}
						image={secretary.image}
						link={"/specific/doctor/clinics/secretary/edit/" + clinic + "/" + secretary.id}
					/>);
	
					return {
						name: secretary.fullName,
						id: secretary.id,
						component: card
					};
				}));
			}

			Promise.all(promises).then(cards => {
				cards.sort((a, b) => a.name === b.name ? 0 : a.name < b.name ? -1 : 1);
				
				setSecretaryCards(cards.map(card => card.component));
			});
		}
	}, [secretariesData, data, clinic]);

	let display = <h2>Loading...</h2>;
	if (data && doctorCards && secretaryCards) {
		display = (
			<>
				{redirect ? <Redirect to={redirect} /> : ""}
				<div className="headerbar">
					<h2>Details</h2> <Button label="Edit" action={() => setEditData(true)} />
				</div>
				{data ? <div className="table">
					<b>Name:</b> <span>{data.name}</span>
					<b>Address:</b> <span>{data.city}, {data.address}</span>
				</div> : "Loading..."}
				{data && editData? 
					<ClinicEditForm
						clinic={clinic}
						doctor={doctor.doctor.id}
						name={data.name}
						city={data.city}
						address={data.address}
						close={() => {setEditData(false)}}
						success={() => {
							clinics.get({id: clinic}).then(clinic_data => {
								setData(clinic_data.data);
								setEditData(false);
							});
						}}
						deleted={() => setRedirect("/specific/doctor/profile")}
					/> : ""}

				{showDoctorSelector ? 
					<SelectDoctor
						close={() => setShowDoctorSelector(false)}
						success={selected => {
							clinics.addDoctor({clinic: clinic, requester: doctor.doctor.id, doctor: selected}).then(() => {
								clinics.getAllDoctors({clinic: clinic}).then(doctors_data => {
									setDoctorsData(doctors_data.data);
								});
							});

							setShowDoctorSelector(false);
						}}
					/>
					: ""
				}

				{showSecretarySelector ? 
					<SelectSecretary
						close={() => setShowSecretarySelector(false)}
						success={selected => {
							clinics.addSecretary({clinic: clinic, requester: doctor.doctor.id, secretary: selected}).then(() => {
								clinics.getAllSecretaries({clinic: clinic}).then(secretaries_data => {
									setSecretariesData(secretaries_data.data);
								});
							});

							setShowSecretarySelector(false);
						}}
					/>
					: ""
				}

				<div className="headerbar">
					<h2>Doctors</h2> <Button label="+" action={() => setShowDoctorSelector(true)} />
				</div>
				<div className="cardList">
					{doctorCards}
				</div>

				<div className="headerbar">
					<h2>Secretaries</h2> <Button label="+" action={() => setShowSecretarySelector(true)} />
				</div>
				<div className="cardList">
					{secretaryCards}
				</div>
			</>
		);
	}

	return (
		<Page title="Edit Clinic">
			{display}
		</Page>
	);
}