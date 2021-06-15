//Reactjs:
import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Button } from "../../Common/Components/Button";
import { Card } from "../../Common/Components/Card"
import { TextInput } from '../../Common/Components/TextInput';
import { Popup } from '../../Common/Components/Popup';
import { getPictureURL } from '../../Common/functions';
import { server } from '../../Common/server';
import { db } from '../../init';

export function SelectSecretaryForm({close, success}) {
	const [cards, setCards] = useState([]);
	
	return (
		<Formik
			initialValues={{
				name: ""
			}}
			validationSchema={Yup.object({
				name: Yup.string()
			})}
			onSubmit={async (values, { setSubmitting }) => {
				setSubmitting(true);

				server.secretaries.search({name: values.name})
				.then(response => {
					const promises = [];
					
					for (const secretary of response.data) {
						promises.push(
							getPictureURL(secretary.id).then(url => {
								secretary.image = url;
								return {
									data: secretary,
									card:
										<Card
											key={secretary.id}
											title={secretary.fullName}
											image={secretary.image}
											altText={secretary.fullName + "'s portrait"}
											action={() => {
												success(secretary.id);
												close();
											}}
										/>
								};
							})
						);
					}

					Promise.all(promises).then(secretaries => {
						secretaries.sort((a, b) => {
							return a.data.fullName > b.data.fullName ? 1 : a.data.fullName < b.data.fullName ? -1 : 0;
						});

						const cards = [];

						for (const secretary of secretaries) {
							cards.push(secretary.card);
						}

						setCards(cards);
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

export function selectSecretaryPopup(popupManager, success) {
	const close = () => {popupManager.remove(popup)};
	const popup =
		<Popup key="Add Secretary" title="Add Secretary" close={close}>
			<SelectSecretaryForm close={close} success={success} />
		</Popup>;
	popupManager.add(popup);
}