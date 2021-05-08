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

const getClinic = fn.httpsCallable("clinics-get");
const joinClinic = fn.httpsCallable("clinics-join");

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

export function ClinicEditor() {
	const auth = useAuth();
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (auth.user) {
				getDoctorID({user: auth.user.uid}).then(response => {
					getDoctor({id: response.data}).then(doctor_data => {
						setDoctor(doctor_data.data);
					});
				});
			}
		});

		return unsubscribe;
	}, [auth]);

	const { clinic } = useParams(); //The ID of clinic.
	const [data, setData] = useState(null);
	const [editData, setEditData] = useState(false);
	const [doctors, setDoctors] = useState();
	const [results, setResults] = useState();
	const [addDoctor, setAddDoctor] = useState(false);
	const [doctor, setDoctor] = useState(null);
	const [redirect, setRedirect] = useState(null);

	useEffect(() => {
		if (clinic) {
			getClinic({id: clinic}).then(clinic_data => {
				setData(clinic_data.data);

				getAllDoctors({clinic: clinic}).then(doctors_data => {
					setDoctors(doctors_data.data);
				});
			});
		}
	}, [clinic]);


	useEffect(() => {
		if (doctors) {
			const promises = [];

			for (const doctor of doctors) {
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
				
				setResults(cards.map(card => card.component));
			});
		}
	}, [doctors, data, clinic]);

	let display = <h2>Loading...</h2>;
	if (data && results) {
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
							getClinic({id: clinic}).then(clinic_data => {
								setData(clinic_data.data);
								setEditData(false);
							});
						}}
						deleted={() => setRedirect("/specific/doctor/profile")}
					/> : ""}

				{addDoctor ? 
					<SelectDoctor
						close={() => setAddDoctor(false)}
						success={selected => {
							joinClinic({clinic: clinic, requester: doctor.doctor.id, doctor: selected}).then(() => {
								getAllDoctors({clinic: clinic}).then(doctors_data => {
									setDoctors(doctors_data.data);
								});
							});

							setAddDoctor(false);
						}}
					/>
					: ""
				}

				<div className="headerbar">
					<h2>Doctors</h2> <Button label="+" action={() => setAddDoctor(true)} />
				</div>
				<div className="cardList">
					{results}
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