import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";

import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput } from '../../../Common/Components/TextInput';
import { server } from "../../../Common/server";

export function ClinicCreateForm({doctor, close, success}) {
	return (
		<Formik
			initialValues={{
				name: "",
				city: "",
				address: ""
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

				server.clinics.add({doctor: doctor, name: values.name, city: values.city, address: values.address})
				.then(response => {
						success(response.data);
						close();
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
					<Button label="Cancel" action={close} />
					<Button type="submit" label="Save" />
				</div>
			</Form>
		</Formik>
	);
}

export function clinicCreatePopup(popupManager, doctor, success) {
	const close = () => {popupManager.remove(popup)};
	const popup =
		<Popup key="Create New Clinic" title="Create New Clinic" close={close}>
			<ClinicCreateForm doctor={doctor} close={close} success={success} />
		</Popup>;
		popupManager.add(popup);
}