import { fn } from "../../../init";
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";

import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput } from '../../../Common/Components/TextInput';

const addClinic = fn.httpsCallable("clinics-add");

export function ClinicCreateForm({doctor, close, success}) {
	return (
	<Popup 
		title="Create New Clinic"
		display={
			<div className="form">
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

						addClinic({doctor: doctor, name: values.name, city: values.city, address: values.address})
						.then(response => {
								success(response);
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
			</div>
		}
		close={close}
	/>);
}