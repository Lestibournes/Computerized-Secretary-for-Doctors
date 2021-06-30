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
import { Strings } from '../../Common/Classes/strings';

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
					body={specialization.hasSpecialization ? Strings.instance.get(132) : ""}
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
						<Popup key="Create Specialization" title={Strings.instance.get(133)} close={close}>
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
							label={Strings.instance.get(135)}
							name="specialization"
							type="text"
							placeholder={Strings.instance.get(136)}
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>

						{saving ?
							<div>{Strings.instance.get(122)}...</div>
						: ""}
					</div>
					<div className="buttonBar">
						<Button label={Strings.instance.get(138)} action={close} />
						<Button type="submit" label={Strings.instance.get(137)} />
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
						<p>{Strings.instance.get(134)}</p>
						<TextInput
							label={Strings.instance.get(135)}
							name="specialization"
							type="text"
							placeholder={Strings.instance.get(136)}
						/>

						{saving ?
							<div>{Strings.instance.get(122)}...</div>
						: ""}
					</div>

					<div className="buttonBar">
						<Button type="cancel" label={Strings.instance.get(89)} action={close} />
						<Button type="submit" label={Strings.instance.get(137)} />
					</div>
				</Form>
			</Formik>
	);
}