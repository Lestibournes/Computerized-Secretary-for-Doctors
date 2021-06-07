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
				.then(async response => {
					const secretary_cards = [];

					for (let secretary of response.data) {
						await getPictureURL(secretary.user.id).then(url => {
							secretary.image = url;
						});

						secretary_cards.push(<Card
							key={secretary.id}
							title={secretary.fullName}
							image={secretary.image}
							altText={secretary.fullName + "'s portrait"}
							action={() => {
								success(secretary.id);
								close();
							}}
						/>);
					}
					
					setCards(secretary_cards);
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