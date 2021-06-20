//Reactjs:
import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Button } from "../../Common/Components/Button";
import { Card } from "../../Common/Components/Card"
import { TextInput } from '../../Common/Components/TextInput';
import { capitalizeAll, getPictureURL } from '../../Common/functions';
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
				.then(response => {
					const promises = [];

					for (let doctor of response.data) {
						promises.push(
							getPictureURL(doctor.id).then(url => {
								return {
									data: doctor,
									card: 
									<Card
										key={doctor.id}
										title={doctor.fullName}
										body={doctor.specializations.map((specialization, index) => {
											return capitalizeAll(specialization.name) + (index < doctor.specializations.length - 1 ? ", " : ".")
										})}
										footer={doctor.clinics.map((clinic, index) => {
											return capitalizeAll(clinic.city) +
												(index < doctor.clinics.length - 1 ? ", " : ".");
										})}
										image={url}
										altText={doctor.fullName}
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
									/>
								}
							})
						);
					}

					Promise.all(promises).then(cards => {
						cards.sort(
							(a, b) => {
								if (a.data.lastName > b.data.lastName) return 1;
								if (a.data.lastName < b.data.lastName) return -1;

								if (a.data.firstName > b.data.firstName) return 1;
								if (a.data.firstName < b.data.firstName) return -1;

								return 0;
							}
						);

						setCards(cards.map(card => card.card));
					});
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
					{saving ?
						<small>Saving...</small>
					: ""}
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