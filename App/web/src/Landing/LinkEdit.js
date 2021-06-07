import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { Button } from "../Common/Components/Button";

import { Popup } from '../Common/Components/Popup';
import { TextInput } from '../Common/Components/TextInput';
import { server } from "../Common/server";

export const LINK_TYPES = {
	DOCTOR: "doctor",
	CLINIC: "clinic"
}
//The reason for separating the popup function and form component is that I want to be ready to switch to displaying the forms in another way than popups, such as by in-place replacement of the display. By doing it like this from the start I save effort should I change my mind later.
export function LinkEditForm({popupManager, link, type, id, close, success}) {
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
							if (response.data.success) {
								success();
								close();
							}
							else {
								popupManager.error(response.data.message);
								setSubmitting(false);
							}
						})
					}
					else {
						popupManager.error("Requested name is not available");
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

export function linkEditPopup(popupManager, link, type, id, success) {
	if (type !== LINK_TYPES.CLINIC && type !== LINK_TYPES.DOCTOR) {
		popupManager.error("Incorrect link type");
		return;
	}
	
	const close = () => popupManager.remove(popup);

	const popup =
		<Popup key={"Edit Link"} title={"Edit Link"} close={close}>
			<LinkEditForm
				popupManager={popupManager}
				link={link}
				type={type}
				id={id}
				close={close}
				success={success}
			/>
		</Popup>

	popupManager.add(popup);
}