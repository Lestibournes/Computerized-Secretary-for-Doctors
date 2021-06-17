import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { TextInput } from "../../../Common/Components/TextInput";
import { db } from "../../../init";
import { useState } from "react";

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
					<TextInput label="Name" name="name" />
					<TextInput label="Duration (as a multiple of the minimum)" type="number" name="duration" min="1" />
					
					{saving ? 
						<div>Saving...</div>
					: ""}
				</div>
				<div className="buttonBar">
					{type ? 
						<Button type="cancel" label="Delete" action={() => {
							const cancel = () => {
								popups.remove(popup);
							};
						
							const popup = 
							<Popup
								key="DeleteAppointmentType"
								title="Delete Appointment Type"
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
					<Button label="Cancel" action={close} />
					<Button type="submit" label="Save" />
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
			Are you sure you wish to delete {type.name} ({type.duration})?
		</div>
		{saving ? 
			<div>Saving...</div>
		: ""}
		<div className="buttonBar">
			<Button label="Cancel" action={cancel} />
			<Button type="cancel" label="Delete" action={() => {
				setSaving(true);
console.log(clinic, doctor, type.id);
				db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("types").doc(type.id).delete()
				.then(deleted)
				.catch(reason => popups.error(reason.code));
			}}
			/>
		</div>
	</>);
}