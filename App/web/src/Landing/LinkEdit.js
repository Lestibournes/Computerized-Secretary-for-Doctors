import { Form, Formik } from "formik";
import { useState } from "react";
import * as Yup from 'yup';
import { Button } from "../Common/Components/Button";

import { Popup } from '../Common/Components/Popup';
import { TextInput } from '../Common/Components/TextInput';
import { usePopups } from "../Common/Popups";
import { server } from "../Common/server";
import { db } from "../init";

export const LINK_TYPES = {
	DOCTOR: "doctor",
	CLINIC: "clinic"
}
//The reason for separating the popup function and form component is that I want to be ready to switch to displaying the forms in another way than popups, such as by in-place replacement of the display. By doing it like this from the start I save effort should I change my mind later.
export function LinkEditForm({link, type, id, close}) {
	const popups = usePopups();

	const [name, setName] = useState("");
	const [message, setMessage] = useState("");
	
	return (
		<Formik
			initialValues={{
				name: link,
			}}
			validationSchema={Yup.object({
				name: Yup.string(),
			})}
			onSubmit={async (values, { setSubmitting }) => {
				setSubmitting(true);
				
				db.collection("links").doc(name).set({
					type: type,
					id: id,
					name: name
				})
				.then(close)
				.catch(reason => popups.error(reason.message))
			}}
		>
			<Form>
				<div className="widgets">
					<TextInput
						label="Link Name"
						name="name"
						type="text"
						value={name}
						onChange={(event) => {
							const name = event.target.value;

							setName(name);

							if (name) {
								db.collection("links").doc(name).get()
								.then(link_snap => {
									if (link_snap.exists) setMessage("Name is already taken");
									else setMessage("Name available");
								})
								.catch(reason => popups.error(reason.message));
							}
						}}
					/>
					<small>{message}</small>
				</div>

				<div className="buttonBar">
					<Button label="Cancel" action={close} />
					<Button type="submit" label="Save" />
				</div>
			</Form>
		</Formik>
	);
}