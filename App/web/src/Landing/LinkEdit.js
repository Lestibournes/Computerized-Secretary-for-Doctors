import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { Button } from "../Common/Components/Button";

import { Popup } from '../Common/Components/Popup';
import { TextInput } from '../Common/Components/TextInput';
import { usePopups } from "../Common/Popups";
import { server } from "../Common/server";

export const LINK_TYPES = {
	DOCTOR: "doctor",
	CLINIC: "clinic"
}
//The reason for separating the popup function and form component is that I want to be ready to switch to displaying the forms in another way than popups, such as by in-place replacement of the display. By doing it like this from the start I save effort should I change my mind later.
export function LinkEditForm({link, type, id, close}) {
	const popups = usePopups();
	
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

				server.links.isAvailable({name: values.name}).then(available => {
					if (available.data) {
						server.links.register({
							name: values.name,
							type: type,
							id: id
						}).then(response => {
							if (response.data.success) close();
							else {
								popups.error(response.data.message);
								setSubmitting(false);
							}
						})
					}
					else {
						popups.error("Requested name is not available");
						setSubmitting(false);
					}
				})
			}}
		>
			<Form>
				<div className="widgets">
					<TextInput
						label="Link Name"
						name="name"
						type="text"
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