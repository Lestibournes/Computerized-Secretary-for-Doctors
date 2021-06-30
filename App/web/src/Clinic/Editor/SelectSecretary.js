//Reactjs:
import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Button } from "../../Common/Components/Button";
import { Card } from "../../Common/Components/Card"
import { TextInput } from '../../Common/Components/TextInput';
import { Popup } from '../../Common/Components/Popup';
import { usePopups } from "../../Common/Popups";
import { getPictureURL } from '../../Common/functions';
import { server } from '../../Common/server';
import { db } from '../../init';
import { Strings } from '../../Common/Classes/strings';

export function SelectSecretaryForm({clinic, close, success}) {
	const popups = usePopups();
	const [cards, setCards] = useState([]);

	const [message, setMessage] = useState("");
	
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
								return {
									data: secretary,
									card:
										<Card
											key={secretary.id}
											title={secretary.fullName}
											image={url}
											altText={secretary.fullName}
											action={() => {
												setMessage(Strings.instance.get(122) + "...");

												db.collection("clinics").doc(clinic).collection("secretaries").doc(secretary.id).set({
													user: secretary.id,
													clinic: clinic
												})
												.then(close)
												.catch(reason => {
													setMessage("");
													popups.error(reason.message)
												});
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
						label={Strings.instance.get(66)}
						name="name"
						type="text"
						placeholder={Strings.instance.get(179)}
					/>
				</div>
				{message ?
					<small>{message}</small>
				:""}
				<div className="buttonBar">
					<Button label={Strings.instance.get(89)} action={close} />
					<Button type="submit" label={Strings.instance.get(71)} />
				</div>
				<div className="cardList">
					{cards}
				</div>
			</Form>
		</Formik>
	);
}

export function selectSecretaryPopup(popups, success) {
	const close = () => {popups.remove(popup)};
	const popup =
		<Popup key="Add Secretary" title={Strings.instance.get(182)} close={close}>
			<SelectSecretaryForm close={close} success={success} />
		</Popup>;
	popups.add(popup);
}