import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { server } from "../../../Common/server";
import { TextInput } from "../../../Common/Components/TextInput";
import { error } from "../../../Common/functions";

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
 export function TypeFormPopup(popupManager, clinic, doctor, type, name, duration, success) {
	const close = () => {
		popupManager.removePopup(popup);
	};

	const popup = 
	<Popup
		key={(type ? "EditType" + type : "NewType")}
		title={(type ? "Edit Type" : "Add Type")}
		close={close}
	>
		<Formik
			initialValues={{
				name: (name ? name : ""),
				duration: (duration ? duration : 1)
			}}

			validationSchema={Yup.object({
				duration: Yup.number().min(1).integer(),
			})}

			onSubmit={async (values, { setSubmitting }) => {
				setSubmitting(true);

				const parameters = {
					clinic: clinic,
					doctor: doctor,
					type: type,
					name: values.name,
					duration: values.duration
				}

				if (type) {
					server.schedules.editType(parameters).then(response => {
						if (response.data.success) {
							success({
								id: response.data.id,
								name: response.data.name,
								duration: response.data.duration
							});
							close();
						}
						else error(popupManager, response.data.message);
					});
				}
				else {
					server.schedules.addType(parameters).then(response => {
						if (response.data.success) {
							success({
								id: response.data.id,
								name: response.data.name,
								duration: response.data.duration
							});
							close();
						}
						else error(popupManager, response.data.message);
					});
				}
			}}
		>
			<Form>
				<div className="widgets">
					<TextInput label="Name" name="name" />
					<TextInput label="Duration (as a multiple of the minimum)" type="number" name="duration" min="1" />
				</div>
				<div className="buttonBar">
					{type ? 
						<Button type="cancel" label="Delete" action={() => {
							TypeDeletePopup(popupManager, clinic, doctor, type, name, duration, (result) => {
								success(result);
								close();
							})
						}} />
					: ""}
					<Button label="Cancel" action={close} />
					<Button type="submit" label="Save" />
				</div>
			</Form>
		</Formik>
	</Popup>;

	popupManager.addPopup(popup);
}


/**
 * Popup window for setting the minimum appointment duration.
 * @param {() => []} getPopups A function to get array that holds the Page's displayed popups.
 * @param {([]) => {}} setPopups A function to update the Page's displayed popups.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 * @param {string} type The id of the appointment type.
 * @param {({id: string}) => {}} success Callback for after updating the appointment type.
 */
export function TypeDeletePopup(popupManager, clinic, doctor, type, name, duration, success) {
	const close = () => {
		popupManager.removePopup(popup);
	};

	const popup = 
	<Popup
		key="DeleteType"
		title="Delete Type"
		close={close}
	>
		<div className="widgets">
			Are you sure you wish to delete {name} ({duration})?
		</div>
		<div className="buttonBar">
			<Button label="Cancel" action={close} />
			<Button type="cancel" label="Delete" action={() => {
				const parameters = {
					clinic: clinic,
					doctor: doctor,
					type: type,
				}

				server.schedules.deleteType(parameters).then(response => {
					if (response.data.success) {
						success({
							id: response.data.id
						});
						close();
					}
					else error(popupManager, response.data.message);
				});
			}}
			/>
		</div>
	</Popup>;

	popupManager.addPopup(popup);
}