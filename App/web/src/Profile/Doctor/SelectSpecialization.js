//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Button } from "../../Common/Components/Button";
import { Card } from "../../Common/Components/Card"
import { TextInput } from '../../Common/Components/TextInput';
import { Popup } from '../../Common/Components/Popup';
import { capitalizeAll } from '../../Common/functions';
import { server } from '../../Common/server';
import { db } from '../../init';
import { usePopups } from '../../Common/Popups';

export function SelectSpecializationForm({doctor, close}) {
	const popups = usePopups();

	const [cards, setCards] = useState([]);
	const [specializations, setSpecializations] = useState();
	const [saving, setSaving] = useState(false); //todo: make it work with multiple simultaneous saves.
	const [search, setSearch] = useState("");
	const [results, setResults] = useState();

	useEffect(() => {
		if (doctor) {
			return db.collection("users").doc(doctor).collection("specializations").onSnapshot(
				spec_snaps => {
					const specs = spec_snaps.docs.map(spec_snap => {
						const data = spec_snap.data();
						data.id = spec_snap.id;
						return data;
					});

					setSpecializations(specs);
			})
		}
	}, [doctor]);

	useEffect(() => {
		let specRef = db.collection("specializations");
		
		return specRef.onSnapshot(
			spec_snaps => {
				const specs = [];
				
				for (const spec_snap of spec_snaps.docs) {
					if (!search || spec_snap.id.toLowerCase().includes(search.toLowerCase())) {
						const data = spec_snap.data();
						data.id = spec_snap.id;

						data.hasSpecialization = false;

						for (const spec of specializations) {
							if (spec.id.toLowerCase() === data.id.toLowerCase()) data.hasSpecialization = true;
						}

						specs.push(data);
					}
				}

				setResults(specs);
			},
			error => popups.error(error)
		)
	}, [search, specializations]);

	useEffect(() => {
		if (results) {
			const specialization_cards = [];
							
			for (let specialization of results) {
				specialization_cards.push(<Card
					key={specialization.id}
					title={capitalizeAll(specialization.id)}
					body={specialization.hasSpecialization ? "Already specified" : ""}
					action={() => {
						setSaving(true);
						
						db.collection("users").doc(doctor).collection("specializations").doc(specialization.id).set({name: specialization.id})
						.then(() => setSaving(false))
						.catch(reason => popups.error(reason.code));
					}}
				/>);
			}
			
			setCards(specialization_cards);
		}
	}, [results])

	return (
		<>
			<Formik
				initialValues={{}}
				validationSchema={Yup.object({
					specialization: Yup.string()
				})}
				onSubmit={async (values, { setSubmitting }) => {
					setSubmitting(true);

					const close = () => {popups.remove(popup)};

					const popup =
						<Popup key="Create Specialization" title="Create New Specialization" close={close}>
							<CreateSpecializationForm
								doctor={doctor}
								specialization={search}
								close={close} />
						</Popup>;

					popups.add(popup);
				}}
			>
				<Form>
					<div className="widgets">
						<TextInput
							label="Specialization"
							name="specialization"
							type="text"
							placeholder="Pediatrician"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>

						{saving ?
							<div>Saving...</div>
						: ""}
					</div>
					<div className="buttonBar">
						<Button label="Close" action={close} />
						<Button type="submit" label="Create" />
					</div>
				</Form>
			</Formik>

			<div className="cardList">
				{cards}
			</div>
		</>
	);
}

function CreateSpecializationForm({doctor, specialization, close}) {
	const popups = usePopups();
	const [saving, setSaving] = useState(false);

	return (
			<Formik
				initialValues={{
					specialization: specialization ? specialization : ""
				}}
				validationSchema={Yup.object({
					specialization: Yup.string()
				})}
				onSubmit={async (values, { setSubmitting }) => {
					setSubmitting(true);
					setSaving(true);

					db.collection("users").doc(doctor).collection("specializations").doc(values.specialization).set({name: values.specialization})
					.then(close)
					.catch(reason => popups.error(reason.code));
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

						{saving ?
							<div>Saving...</div>
						: ""}
					</div>

					<div className="buttonBar">
						<Button type="cancel" label="Cancel" action={close} />
						<Button type="submit" label="Create" />
					</div>
				</Form>
			</Formik>
	);
}