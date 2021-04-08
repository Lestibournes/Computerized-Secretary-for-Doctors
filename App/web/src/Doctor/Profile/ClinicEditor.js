//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form, useField } from 'formik';
import * as Yup from 'yup';
import { MainHeader, useAuth } from "../../Common/CommonComponents";
import { Redirect, useParams } from 'react-router-dom';
import { db, fn } from '../../init';
import { Card, Button } from "../../Common/Components/Button";
import { TextInput } from '../../Common/Components/TextInput';

const getClinic = fn.httpsCallable("clinics-get");

/**
@todo
Edit clinic page:
Can either be used to create a new clinic or edit an existing one. For an existing clinic it will show:
* Options to modify the name and location.
* A list of current members with the option to boot them.
* A list of pending membership requests with the option to accept or reject them.
* A button to go to a search page to find existing doctors and invite them to join the clinic.
*/

function ClinicEditForm({name, city, address}) {
	return (
		<div className="form">
			<h1>{name} Clinic</h1>
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
						<Button link="/general/login" label="Login" />
						<Button type="submit" label="Register" />
					</div>
				</Form>
			</Formik>
		</div>
	);
}

export function ClinicEditor() {
	const auth = useAuth();
	const [redirect, setRedirect] = useState(false);
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			console.log(status);
			if (!status) setRedirect(true);
		});

		return unsubscribe;
	}, [auth.user]);

	const { clinic } = useParams(); //The ID of clinic.
	const [data, setData] = useState(null);

	useEffect(() => {
		if (clinic) {
			getClinic({id: clinic}).then(response => {
				setData(response.data);
			});
		}
	}, [clinic]);

	return (
		<div className="page">
			{redirect ? <Redirect to="/general/login" /> : null }
			<MainHeader section="Register"></MainHeader>
			<div className="center">
				{data ? <ClinicEditForm name={data.name} city={data.city} address={data.address} /> : "Loading..."}
			</div>
		</div>
	);
}