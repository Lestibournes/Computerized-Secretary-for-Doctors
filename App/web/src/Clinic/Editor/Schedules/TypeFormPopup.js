import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { TextInput } from "../../../Common/Components/TextInput";
import { db } from "../../../init";
import { useState } from "react";
import { Strings } from "../../../Common/Classes/strings";

/**
 * Popup window for setting the minimum appointment duration.
 * @param {() => []} getPopups A function to get array that holds the Page's displayed popups.
 * @param {([]) => {}} setPopups A function to update the Page's displayed popups.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 * @param {string} type The id of the appointment type.
 * @param {string} name The current minimum appointment duration.
 * @param {number} duration The current appointment duration multiplier.
 * @param {({
 * 					id: string,
 * 					name: string,
 * 					duration: number
 * 				}) => {}} success Callback for after updating the appointment type.
 */
export function TypeEditForm({popups, clinic, doctor, type, close}) {
	const [saving, setSaving] = useState(false);

	return (
		<Formik
			initialValues={{
				name: (type?.name ? type.name : ""),
				duration: (type?.duration ? type.duration : 1)
			}}

			validationSchema={Yup.object({
				duration: Yup.number().min(1).integer(),
			})}

			onSubmit={async (values, { setSubmitting }) => {
				setSubmitting(true);
				setSaving(true);

				const data = {
					name: values.name,
					duration: values.duration
				}

				if (type) {
					db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("types").doc(type.id).update(data)
					.then(close)
					.catch(reason => popups.error(reason.code));
				}
				else {
					db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("types").add(data)
					.then(close)
					.catch(reason => popups.error(reason.code));
				}
			}}
		>
			<Form>
				<div className="widgets">
					<TextInput label={Strings.instance.get(66)} name="name" />
					<TextInput label={Strings.instance.get(163)} type="number" name="duration" min="1" />
					
					{saving ? 
						<div>{Strings.instance.get(122)}...</div>
					: ""}
				</div>
				<div className="buttonBar">
					{type ? 
						<Button type="cancel" label={Strings.instance.get(84)} action={() => {
							const cancel = () => {
								popups.remove(popup);
							};
						
							const popup = 
							<Popup
								key="DeleteAppointmentType"
								title={Strings.instance.get(84)}
								close={cancel}
							>
								<TypeDeleteForm
									popups={popups}
									clinic={clinic}
									doctor={doctor}
									type={type}
									close={close}
									deleted={() => {
										cancel();
										close();
									}}
								/>
							</Popup>;
						
							popups.add(popup);
						}} />
					: ""}
					<Button label={Strings.instance.get(89)} action={close} />
					<Button type="submit" label={Strings.instance.get(101)} />
				</div>
			</Form>
		</Formik>);
}


/**
 * Popup window for setting the minimum appointment duration.
 * @param {() => []} getPopups A function to get array that holds the Page's displayed popups.
 * @param {([]) => {}} setPopups A function to update the Page's displayed popups.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 * @param {string} type The id of the appointment type.
 * @param {({id: string}) => {}} deleted Callback for after updating the appointment type.
 */
export function TypeDeleteForm({popups, clinic, doctor, type, cancel, deleted}) {
	const [saving, setSaving] = useState(false);

	return (<>
		<div className="widgets">
			{Strings.instance.get(165, new Map([
				["name", type.name],
				["duration", type.duration]
			]))}
		</div>
		{saving ? 
			<div>{Strings.instance.get(122)}...</div>
		: ""}
		<div className="buttonBar">
			<Button label={Strings.instance.get(89)} action={cancel} />
			<Button type="cancel" label={Strings.instance.get(84)} action={() => {
				setSaving(true);

				db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("types").doc(type.id).delete()
				.then(deleted)
				.catch(reason => popups.error(reason.code));
			}}
			/>
		</div>
	</>);
}