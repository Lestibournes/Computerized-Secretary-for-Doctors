//Reactjs:
import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Button } from "../../../Common/Components/Button";
import { Card } from "../../../Common/Components/Card"
import { TextInput } from '../../../Common/Components/TextInput';
import { Popup } from '../../../Common/Components/Popup';
import { capitalizeAll } from '../../../Common/functions';
import { server } from '../../../Common/server';

function hasSpecialization(specializations, specialization) {
	for (const spec of specializations) {
		if (spec.id.toLowerCase() === specialization.toLowerCase()) return true;
	}

	return false;
}

export function SelectSpecialization({specializations, close, success}) {
	const [cards, setCards] = useState([]);
	const [create, setCreate] = useState(false);
	
	return (
		<Popup title="Add Specialization" close={close}>
			<Formik
				initialValues={{
					specialization: ""
				}}
				validationSchema={Yup.object({
					specialization: Yup.string()
				})}
				onSubmit={async (values, { setSubmitting }) => {
					setSubmitting(true);
					
					server.specializations.search({text: values.specialization})
					.then(response => {
						const specialization_cards = [];
						
						for (let specialization of response.data) {
							specialization_cards.push(<Card
								key={specialization.id}
								title={capitalizeAll(specialization.id)}
								body={hasSpecialization(specializations, specialization.id) ? "Already specified" : ""}
								action={() => success(specialization.id)}
							/>);
						}
						
						setCards(specialization_cards);
					});
				}}
			>
				<Form>
					<div className="widgets">
						<TextInput
							label="Specialization"
							name="specialization"
							type="text"
							placeholder="Pediatrician"
						/>
					</div>
					<div className="buttonBar">
						<Button type="cancel" label="Create" action={() => {
							setCreate(true);
						}} />
						<Button label="Close" action={close} />
						<Button type="submit" label="Search" />
					</div>
				</Form>
			</Formik>

			<div className="cardList">
				{cards}
			</div>

			{create ?
				<CreateSpecialization
					close={() => setCreate(false)}
					success={specialization => {
						success(specialization)
						setCreate(false);
					}}
				/>
			: "" }
		</Popup>
		);
}

function CreateSpecialization({specialization, close, success}) {
	return (
		<Popup title="Create New Specialization" close={close}>
			<p>Please go back and check carefully and only create a new specialization if it doesn't already exist.</p>
			<Formik
				initialValues={{
					specialization: specialization
				}}
				validationSchema={Yup.object({
					specialization: Yup.string()
				})}
				onSubmit={async (values, { setSubmitting }) => {
					setSubmitting(true);
					server.specializations.create({name: values.specialization}).then(() => {
						success(values.specialization);
					})
				}}
			>
				<Form>
					<div className="widgets">
						<TextInput
							label="Specialization"
							name="specialization"
							type="text"
							placeholder="Pediatrician"
						/>
					</div>
					<div className="buttonBar">
						<Button type="cancel" label="Cancel" action={close} />
						<Button type="submit" label="Create" />
					</div>
				</Form>
			</Formik>
		</Popup>
	);
}