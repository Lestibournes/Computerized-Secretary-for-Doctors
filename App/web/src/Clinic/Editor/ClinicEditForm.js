import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { Button } from "../../Common/Components/Button";
import { Popup } from "../../Common/Components/Popup";
import { TextInput } from "../../Common/Components/TextInput";
import { server } from "../../Common/server";

export function ClinicEditForm({popupManager, clinic, doctor, name, city, address, close, success, deleted}) {
	return (
		<Formik
			initialValues={{
				name: name,
				city: city,
				address: address
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
				server.clinics.edit({id: clinic, doctor: doctor, name: values.name, city: values.city, address: values.address})
				.then(response => {
					if (!response.data.success) popupManager.error(response.data.message)
					else {success()}
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
				</div>
				<div className="buttonBar">
					<Button type="cancel" label="Delete"
						action={() => {
							clinicDeletePopup(
								popupManager,
								clinic,
								doctor,
								deleted
							)
						}}
					/>
					<Button label="Cancel" action={close} />
					<Button type="submit" label="Save" />
				</div>
			</Form>
		</Formik>
	);
}

export function ClinicDeleteForm({popupManager, clinic, doctor, close, success}) {
	return (
		<div>
			<p>Are you sure you wish to delete this clinic?</p>
			<p>This action is permanent and cannot be undone.</p>
			<div className="buttonBar">
				<Button type="cancel" label="Yes" action={() => {
					server.clinics.delete({id: clinic, doctor: doctor}).then(response => {
						if (!response.data.success) popupManager.error(response.data.message)
						else {success()}
					});
				}} />
				<Button type="okay" label="Cancel" action={close} />
			</div>
		</div>
	);
}

export function clinicEditPopup(popupManager, clinic, doctor, name, city, address, deleted, success) {
	const close = () => {popupManager.remove(popup)};
	const popup =
		<Popup key="Edit Details" title="Edit Details" close={close}>
			<ClinicEditForm
				popupManager={popupManager}
				clinic={clinic}
				doctor={doctor}
				name={name}
				city={city}
				address={address}
				close={close}
				success={success}
				deleted={deleted}
			/>
		</Popup>;
		popupManager.add(popup);
}

export function clinicDeletePopup(popupManager, clinic, doctor, success) {
	const close = () => {popupManager.remove(popup)};
	const popup =
		<Popup key="Confirm Clinic Deletion" title="Confirm Deletion" close={close}>
			<ClinicDeleteForm
				popupManager={popupManager}
				clinic={clinic}
				doctor={doctor}
				close={close}
				success={success}
			/>
		</Popup>;
		popupManager.add(popup);
}