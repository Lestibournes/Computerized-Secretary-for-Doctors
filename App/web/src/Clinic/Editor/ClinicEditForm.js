import { Form, Formik } from "formik";
import { useState } from "react";
import * as Yup from 'yup';
import { Button } from "../../Common/Components/Button";
import { Popup } from "../../Common/Components/Popup";
import { TextInput } from "../../Common/Components/TextInput";
import { usePopups } from "../../Common/Popups";
import { db } from "../../init";

export function ClinicEditForm({clinic, close, deleted}) {
	const popups = usePopups();

	const [saving, setSaving] = useState(false);

	return (
		<Formik
			initialValues={{
				name: clinic.name,
				city: clinic.city,
				address: clinic.address
			}}
			validationSchema={Yup.object({
				name: Yup.string()
					.required("Required"),
				city: Yup.string()
					.required("Required"),
				address: Yup.string()
					.required("Required")
			})}
			onSubmit={async (values, { setSubmitting }) => {
				setSubmitting(true);
				setSaving(true);

				db.collection("clinics").doc(clinic.id).update({name: values.name, city: values.city, address: values.address})
				.then(close)
				.catch(reason => {
					setSaving(false);
					popups.error(reason.message);
				});
			}}
		>
			<Form>
				<div className="widgets">
					<TextInput
						label="Clinic Name"
						name="name"
						type="text"
						placeholder="Eden"
					/>
					<TextInput
						label="City"
						name="city"
						type="text"
						placeholder="Jerusalem"
					/>
					<TextInput
						label="Address"
						name="address"
						type="text"
						placeholder="13 Holy Square"
					/>
					{saving ?
						<small>Saving...</small>
					: ""}
				</div>
				<div className="buttonBar">
					<Button type="cancel" label="Delete"
						action={() => {
							const close = () => {popups.remove(popup)};
	
							const popup =
								<Popup key="Confirm Clinic Deletion" title="Confirm Deletion" close={close}>
									<ClinicDeleteForm
										clinic={clinic}
										close={close}
										deleted={deleted}
									/>
								</Popup>;

							popups.add(popup);
						}}
					/>
					<Button label="Cancel" action={close} />
					<Button type="submit" label="Save" />
				</div>
			</Form>
		</Formik>
	);
}

export function ClinicDeleteForm({clinic, close, deleted}) {
	const popups = usePopups();
	
	return (
		<div>
			<p>Are you sure you wish to delete this clinic?</p>
			<p>This action is permanent and cannot be undone.</p>
			<div className="buttonBar">
				<Button type="cancel" label="Yes" action={() => {
					db.collection("clinics").doc(clinic.id).delete()
					.then(() => {
						deleted();
						close();
					})
					.catch(reason => popups.error(reason));
				}} />
				<Button type="okay" label="Cancel" action={close} />
			</div>
		</div>
	);
}