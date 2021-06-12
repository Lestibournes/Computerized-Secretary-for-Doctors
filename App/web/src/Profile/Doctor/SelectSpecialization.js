//Reactjs:
import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Button } from "../../Common/Components/Button";
import { Card } from "../../Common/Components/Card"
import { TextInput } from '../../Common/Components/TextInput';
import { Popup } from '../../Common/Components/Popup';
import { capitalizeAll } from '../../Common/functions';
import { server } from '../../Common/server';

function hasSpecialization(specializations, specialization) {
	for (const spec of specializations) {
		if (spec.id.toLowerCase() === specialization.toLowerCase()) return true;
	}

	return false;
}

export function SelectSpecializationForm({popupManager, specializations, close, success}) {
	const [cards, setCards] = useState([]);

	return (
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
						<Button type="cancel" label="Create"
							action={
								() => {
									createSpecializationPopup(
										popupManager,
										"",
										specialization => {
											success(specialization)
										}
									);
								}
							}
						/>
						<Button label="Close" action={close} />
						<Button type="submit" label="Search" />
					</div>
				</Form>
			</Formik>

			<div className="cardList">
				{cards}
			</div>
		</>
	);
}

function CreateSpecializationForm({specialization, close, success}) {
	return (
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
						close();
					})
				}}
			>
				<Form>
					<div className="widgets">
						<p>Please go back and check carefully and only create a new specialization if it doesn't already exist.</p>
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
	);
}

export function selectSpecializationPopup(popupManager, specializations, success) {
	const close = () => {popupManager.remove(popup)};
	const popup =
		<Popup key="Select Specialization" title="Add Specialization" close={close} popupManager={popupManager}>
			<SelectSpecializationForm popupManager={popupManager} specializations={specializations} close={close} success={success} />
		</Popup>;
	popupManager.add(popup);
}

export function createSpecializationPopup(popupManager, specialization, success) {
	const close = () => {popupManager.remove(popup)};
	const popup =
		<Popup key="Create Specialization" title="Create New Specialization" close={close}>
			<CreateSpecializationForm specializations={specialization} close={close} success={success} />
		</Popup>;
	popupManager.add(popup);
}

export function removeSpecializationPopup(popupManager, doctor, specialization, success) {
	const close = () => {popupManager.remove(popup)}

	const popup = 
		<Popup key="Remove Specialization" title="Please Confirm" close={close}>
			<p>
				Are you sure you wish to remove the specialization {capitalizeAll(specialization)}?
			</p>
			<div className="buttonBar">
				<Button type="okay" label="Cancel" action={close} />
				<Button type="cancel" label="Yes" action={() => {
					server.doctors.removeSpecialization({doctor: doctor, specialization: specialization})
					.then(() => {
						success();
						close();
					});
				}} />
			</div>
		</Popup>;

	popupManager.add(popup);
}