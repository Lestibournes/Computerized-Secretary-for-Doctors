import "./ClinicEditor.css"
//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { MainHeader, useAuth } from "../../Common/CommonComponents";
import { Redirect, useParams } from 'react-router-dom';
import { fn, st } from '../../init';
import { Button } from "../../Common/Components/Button";
import { Card } from "../../Common/Components/Card"
import { TextInput } from '../../Common/Components/TextInput';
import { Popup } from '../../Common/Components/Popup';

const getClinic = fn.httpsCallable("clinics-get");
const getAllDoctors = fn.httpsCallable("clinics-getAllDoctors");

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

function ClinicEditForm({clinic, name, city, address, close}) {
	const [confirmDelete, setConfirmDelete] = useState(false);
	
	return (
		<div className="form">
			<h2>Edit Details</h2>
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
					{confirmDelete ? <Popup display={<ConfirmDelete clinic={clinic} close={() => setConfirmDelete(false)} />} /> : ""}
				</Form>
			</Formik>
		</div>
	);
}

function ConfirmDelete({clinic, close}) {
	return (<>
		<h2>Are you sure you wish to delete this clinic?</h2>
		<p>This action is permanent and cannot be undone.</p>
		<div className="panel">
						<Button type="cancel" label="Yes" />
						<Button type="okay" label="Cancel" action={close} />
					</div>
	</>);
}

export function ClinicEditor() {
	const auth = useAuth();
	const [redirect, setRedirect] = useState(false);
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!status) setRedirect(true);
		});

		return unsubscribe;
	}, [auth]);

	const { clinic } = useParams(); //The ID of clinic.
	const [data, setData] = useState(null);
	const [editData, setEditData] = useState(false);
	const [doctors, setDoctors] = useState([]);
	const [results, setResults] = useState([]);
	const [addDoctor, setAddDoctor] = useState(false);

	useEffect(() => {
		if (clinic) {
			getClinic({id: clinic}).then(clinic_data => {
				setData(clinic_data.data);

				getAllDoctors({clinic: clinic}).then(doctors_data => {
					setDoctors(doctors_data.data);
					console.log(doctors_data.data);
				})
			});
		}
	}, [clinic]);


	useEffect(() => {
		const cards = [];
		if (doctors) {
			for (let doctor of doctors) {
				storage.child("users/" + doctor.user.id + "/profile.png").getDownloadURL().then(url => {
					doctor.image = url;
					cards.push(<Card
						key={doctor.doctor.id + Math.random()}
						link={"#"}
						title={doctor.user.firstName + " " + doctor.user.lastName + (doctor.doctor.id === data.owner ? " (owner)" : "")}
						body=
							{doctor.fields.length > 0 ?
								doctor.fields.map((field, index) => field.id + (index < doctor.fields.length - 1 ? ", "
								: ""))
							: "No specializations specified"}
						footer={doctor.clinics.map(clinic => {return clinic.name + ", " + clinic.city + "; "})}
						image={doctor.image} />);
					
					if (cards.length >= doctors.length) {
						setResults(cards);
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
				{data && editData? <Popup display={<ClinicEditForm name={data.name} city={data.city} address={data.address} close={() => {setEditData(false)}} />} /> : ""}
				<div className="headerbar">
					<h2>Doctors</h2> <Button label="+" action={() => setAddDoctor(true)} />
				</div>
				<div className="searchresults">
					{results}
				</div>
			</div>
		);
	}

	return (
		<>
			{redirect ? <Redirect to="/general/login" /> : null }
			<MainHeader section="Register"></MainHeader>
			<h1>Edit Clinic</h1>
			{display}
		</>
	);
}