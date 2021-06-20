//Reactjs:
import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Button } from "../../Common/Components/Button";
import { Card } from "../../Common/Components/Card"
import { TextInput } from '../../Common/Components/TextInput';
import { getPictureURL } from '../../Common/functions';
import { server } from '../../Common/server';
import { db } from '../../init';
import { usePopups } from '../../Common/Popups';

export function SelectDoctorForm({clinic, close}) {
	const popups = usePopups();

	const [saving, setSaving] = useState(false);
	const [cards, setCards] = useState([]);
	
	return (
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

				server.doctors.search({name: values.name, city: values.city, specialization: values.specialization})
				.then(async response => {
					const doctor_cards = [];

					for (let doctor of response.data) {
						getPictureURL(doctor.id).then(url => {
							doctor_cards.push(<Card
								key={doctor.id}
								title={doctor.fullName}
								body={doctor.specializations.map((specialization, index) => {
									return specialization.id + (index < doctor.specializations.length - 1 ? ", " : ".")
								})}
								footer={doctor.clinics.map((clinic, index) => {
									return clinic.name + ", " + clinic.city +
										(index < doctor.clinics.length - 1 ? ", " : ".");
								})}
								image={url}
								altText={doctor.fullName + "'s portrait"}
								action={() => {
									setSaving(true);
	
									db.collection("clinics").doc(clinic.id).collection("doctors").doc(doctor.id).set({
										user: doctor.id,
										clinic: clinic.id,
										minimum: 15
									})
									.then(close)
									.catch(reason => popups.error(reason.message));
								}}
							/>);
						});

					}
					
					setCards(doctor_cards);
				});
			}}
		>
			<Form>
				<div className="widgets">
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
				</div>
				<div className="buttonBar">
					<Button label="Cancel" action={close} />
					<Button type="submit" label="Search" />
				</div>
				<div className="cardList">
					{cards}
				</div>
			</Form>
		</Formik>
	);
}