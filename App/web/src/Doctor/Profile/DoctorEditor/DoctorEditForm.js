import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { useState } from "react";
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { TextInput } from "../../../Common/Components/TextInput";
import { fn } from "../../../init";
import { ConfirmDelete } from "./ConfirmDelete";

const editClinic = fn.httpsCallable("clinics-edit");

export function ClinicEditForm({clinic, doctor, name, city, address, close, success, deleted}) {
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [problem, setProblem] = useState(null);
	let display = 
		<Popup title="Edit Details"
			display={
				<div className="form">
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
							editClinic({id: clinic, doctor: doctor, name: values.name, city: values.city, address: values.address})
							.then(response => {
								if (!response.data.success) {setProblem(response.data.message)}
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
								<Button type="cancel" label="Delete" action={() => setConfirmDelete(true)} />
								<Button label="Cancel" action={close} />
								<Button type="submit" label="Save" />
							</div>
							{confirmDelete ? <ConfirmDelete
									clinic={clinic}
									doctor={doctor}
									close={() => setConfirmDelete(false)}
									success={deleted} />
								: ""}
							{problem ? <Popup title="Error" display={<div>{problem}</div>} close={() => setProblem(false)} /> : ""}
						</Form>
					</Formik>
				</div>
			}
			close={close}
		/>
	return display;
}