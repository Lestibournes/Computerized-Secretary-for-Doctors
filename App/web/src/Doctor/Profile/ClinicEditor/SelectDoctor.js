//Reactjs:
import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Button } from "../../../Common/Components/Button";
import { Card } from "../../../Common/Components/Card"
import { TextInput } from '../../../Common/Components/TextInput';
import { Popup } from '../../../Common/Components/Popup';
import { getPictureURL } from '../../../Common/functions';
import { server } from '../../../Common/server';

export function SelectDoctorForm({close, success}) {
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
						await getPictureURL(doctor.user.id).then(url => {
							doctor.image = url;
						});

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
							image={doctor.image}
							altText={doctor.user.firstName + " " + doctor.user.lastName + "'s portrait"}
							action={() => {
								success(doctor.doctor.id);
								close();
							}}
						/>);
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

export function selectDoctorPopup(popupManager, success) {
	const close = () => {popupManager.remove(popup)};
	const popup =
		<Popup key="Add Doctor" title="Add Doctor" close={close}>
			<SelectDoctorForm close={close} success={success} />
		</Popup>;
	popupManager.add(popup);
}