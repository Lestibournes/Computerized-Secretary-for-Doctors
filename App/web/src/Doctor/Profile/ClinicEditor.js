import "./ClinicEditor.css"
//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { MainHeader, useAuth } from "../../Common/CommonComponents";
import { Redirect, useParams } from 'react-router-dom';
import { db, fn, st } from '../../init';
import { Button } from "../../Common/Components/Button";
import { Card } from "../../Common/Components/Card"
import { TextInput } from '../../Common/Components/TextInput';
import { Popup } from '../../Common/Components/Popup';

const getClinic = fn.httpsCallable("clinics-get");
const editClinic = fn.httpsCallable("clinics-edit");
const deleteClinic = fn.httpsCallable("clinics-delete");
const joinClinic = fn.httpsCallable("clinics-join");

const getDoctor = fn.httpsCallable("doctors-get");
const getAllDoctors = fn.httpsCallable("clinics-getAllDoctors");
const searchDoctors = fn.httpsCallable("doctors-search");

const storage = st.ref();

/**
@todo
Edit clinic page:
Can either be used to create a new clinic or edit an existing one. For an existing clinic it will show:
* Options to modify the name and location.
* A list of current members with the option to boot them.
* A list of pending membership requests with the option to accept or reject them.
* A button to go to a search page to find existing doctors and invite them to join the clinic.
*/

function ClinicEditForm({clinic, doctor, name, city, address, close, success, deleted}) {
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [problem, setProblem] = useState(null);
	return (
		<div className="form">
			<Formik
				initialValues={{
					name: name,
					city: city,
					address: address
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
					editClinic({id: clinic, doctor: doctor, name: values.name, city: values.city, address: values.address})
					.then(response => {
						if (!response.data.success) {setProblem(response.data.message)}
						else {success()}
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
						<Button type="cancel" label="Delete" action={() => setConfirmDelete(true)} />
						<Button label="Cancel" action={close} />
						<Button type="submit" label="Save" />
					</div>
					{confirmDelete ? <Popup title="Confirm Deletion"
						display={<ConfirmDelete
							clinic={clinic}
							doctor={doctor}
							close={() => setConfirmDelete(false)}
							success={deleted} />}
						close={() => setConfirmDelete(false)} /> : ""}
					{problem ? <Popup title="Error" display={<div>{problem}</div>} close={() => setProblem(false)} /> : ""}
				</Form>
			</Formik>
		</div>
	);
}

function ConfirmDelete({clinic, doctor, close, success}) {
	const [problem, setProblem] = useState(null);

	return (<>
		<p>Are you sure you wish to delete this clinic?</p>
		<p>This action is permanent and cannot be undone.</p>
		<div className="panel">
			<Button type="cancel" label="Yes" action={() => {
				deleteClinic({id: clinic, doctor: doctor}).then(response => {
					if (!response.data.success) {setProblem(response.data.message)}
					else {success()}
				});
			}} />
			<Button type="okay" label="Cancel" action={close} />
			{problem ? <Popup title="Error" display={<div>{problem}</div>} close={() => setProblem(false)} /> : ""}
		</div>
	</>);
}

function SelectDoctor({close, success}) {
	const [cards, setCards] = useState([]);
	
	return (
		<div className="form">
			<Formik
				initialValues={{
					name: "",
					city: "",
					specialization: ""
				}}
				validationSchema={Yup.object({
					name: Yup.string(),
					city: Yup.string(),
					specialization: Yup.string()
				})}
				onSubmit={async (values, { setSubmitting }) => {
					setSubmitting(true);

					searchDoctors({name: values.name, city: values.city, specialization: values.specialization})
					.then(response => {
						const doctor_cards = [];

						for (let doctor of response.data) {
							storage.child("users/" + doctor.user.id + "/profile.png").getDownloadURL().then(url => {
								doctor_cards.push(<Card
									key={doctor.doctor.id}
									title={doctor.user.firstName + " " + doctor.user.lastName}
									body={doctor.fields.map((field, index) => {
										return (index < doctor.fields.length - 1 ? field.id + "; " : field.id)
									})}
									footer={doctor.clinics.map((clinic, index) => {
										return clinic.name + ", " + clinic.city +
											(index < doctor.clinics.length - 1 ? "; " : "");
									})}
									image={url}
									altText={doctor.user.firstName + " " + doctor.user.lastName + "'s portrait"}
									action={() => success(doctor.doctor.id)}
								/>);

								if (doctor_cards.length === response.data.length) {
									setCards(doctor_cards);
								}
							});
						}

					});
				}}
			>
				<Form>
					<TextInput
						label="Name"
						name="name"
						type="text"
						placeholder="Yoni Robinson"
					/>
					<TextInput
						label="City"
						name="city"
						type="text"
						placeholder="Jerusalem"
					/>
					<TextInput
						label="Specialization"
						name="specialization"
						type="text"
						placeholder="Pediatrician"
					/>
					<div className="panel">
						<Button label="Cancel" action={close} />
						<Button type="submit" label="Search" />
					</div>
				</Form>
			</Formik>

			<div className="cardList">
				{cards}
			</div>
		</div>
	);
}

export function ClinicEditor() {
	const auth = useAuth();
	const [redirect, setRedirect] = useState(false);
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!status) setRedirect("/general/login");
			else if (auth.user) {
				db.collection("users").doc(auth.user.uid).get().then(user_snap => {
					getDoctor({id: user_snap.data().doctor}).then(doctor_data => {
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
	const [doctors, setDoctors] = useState([]);
	const [results, setResults] = useState([]);
	const [addDoctor, setAddDoctor] = useState(false);
	const [doctor, setDoctor] = useState(null);

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
		const cards = [];

		if (doctors) {
			for (const doctor of doctors) {
				storage.child("users/" + doctor.user.id + "/profile.png").getDownloadURL().then(url => {
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
						action={() => alert(doctor.user.firstName + " " + doctor.user.lastName)}
					/>);

					cards.push({
						name: doctor.user.lastName + doctor.user.firstName,
						id: doctor.doctor.id,
						component: card
					});
					
					if (cards.length >= doctors.length) {
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
					}
				});
			}
		}
	}, [doctors, data]);

	let display = <h2>Loading...</h2>;
	if (data && results.length) {
		display = (
			<div>
				<div className="headerbar">
					<h2>Details</h2> <Button label="Edit" action={() => setEditData(true)} />
				</div>
				{data ? <div className="table">
					<b>Name:</b> <span>{data.name}</span>
					<b>Address:</b> <span>{data.city}, {data.address}</span>
				</div> : "Loading..."}
				{data && editData? <Popup title="Edit Details"
					display={<ClinicEditForm
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
						/>}
					close={() => {setEditData(false)}}
					/> : ""}

				{addDoctor ? 
					<Popup
						title="Add Doctor"
						display={
							<SelectDoctor
							close={() => setAddDoctor(false)}
							success={selected => {
								/**
								 * @todo add doctor to clinic.
								 */
								joinClinic({clinic: clinic, requester: doctor.doctor.id, doctor: selected}).then(() => {
									getAllDoctors({clinic: clinic}).then(doctors_data => {
										setDoctors(doctors_data.data);
									});
								});

								setAddDoctor(false);
							}}
							/>
						}
						close={() => setAddDoctor(false)}
					/>
					: ""
				}

				<div className="headerbar">
					<h2>Doctors</h2> <Button label="+" action={() => setAddDoctor(true)} />
				</div>
				<div className="cardList">
					{results}
				</div>
			</div>
		);
	}

	return (
		<>
			{redirect ? <Redirect to={redirect} /> : null }
			<MainHeader section="Register"></MainHeader>
			<h1>Edit Clinic</h1>
			{display}
		</>
	);
}