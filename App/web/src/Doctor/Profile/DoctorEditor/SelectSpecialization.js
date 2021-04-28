//Reactjs:
import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { fn } from '../../../init';
import { Button } from "../../../Common/Components/Button";
import { Card } from "../../../Common/Components/Card"
import { TextInput } from '../../../Common/Components/TextInput';
import { Popup } from '../../../Common/Components/Popup';
import { capitalize } from '../../../Common/functions';

const searchSpecializations = fn.httpsCallable("specializations-search");

function hasSpecialization(specializations, specialization) {
	for (const spec of specializations) {
		if (spec.id.toLowerCase() === specialization.toLowerCase()) return true;
	}

	return false;
}

export function SelectSpecialization({specializations, close, success}) {
	const [cards, setCards] = useState([]);
	const [create, setCreate] = useState(false);
	
	let display = 
		<Popup
			title="Add Specialization"
			display={
				<>
					<Formik
						initialValues={{
							specialization: ""
						}}
						validationSchema={Yup.object({
							specialization: Yup.string()
						})}
						onSubmit={async (values, { setSubmitting }) => {
							setSubmitting(true);

							searchSpecializations({text: values.specialization})
							.then(response => {
								const specialization_cards = [];
								
								for (let specialization of response.data) {
									specialization_cards.push(<Card
										key={specialization.id}
										title={capitalize(specialization.id)}
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
						/>
					: "" }
				</>
			}
			close={close}
		/>;

	return display;
}

function CreateSpecialization({specialization, close, success}) {
	return (
		<Popup
			title="Create New Specialization"
			close={close}
			display={
				<>
					<p>Please check carefully and only create a new specialization if it doesn't already exist</p>
					<Formik
						initialValues={{
							specialization: ""
						}}
						validationSchema={Yup.object({
							specialization: Yup.string()
						})}
						onSubmit={async (values, { setSubmitting }) => {
							setSubmitting(true);
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
				</>
			}
		/>
	);
}