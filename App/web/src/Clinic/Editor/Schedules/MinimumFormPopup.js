import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { server } from "../../../Common/server";
import { TextInput } from "../../../Common/Components/TextInput";
import { db } from "../../../init";

/**
 * Popup window for setting the minimum appointment duration.
 * @param {() => []} getPopups A function to get array that holds the Page's displayed popups.
 * @param {([]) => {}} setPopups A function to update the Page's displayed popups.
 * @param {string} clinic The id of the clinic.
 * @param {string} doctor The id of the doctor.
 * @param {number} minimum The current minimum appointment duration.
 * @param {(minimum: number) => {}} success Callback for after updating the minimum.
 */
 export function MinimumFormPopup(popups, clinic, doctor, minimum, success) {
	const close = () => {
		popups.remove(popup);
	};

	const popup = 
	<Popup
		key="MinimumForm"
		title="Set Minimum"
		close={close}
	>
		<Formik
			initialValues={{
				minimum: (minimum ? minimum : 15)
			}}
			validationSchema={Yup.object({
				min: Yup.number().min(0).integer(),
			})}
			onSubmit={async (values, { setSubmitting }) => {
				setSubmitting(true);

				db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).update({minimum: values.minimum})
				.then(() => {
					success(values.minimum);
					close();
				})
				.catch(reason => popups.error(reason.code));
			}}
		>
			<Form>
				<div className="widgets">
					<TextInput label="Minimum Duration (in minutes)" type="number" name="minimum" min="0" />
				</div>
				<div className="buttonBar">
					<Button label="Cancel" action={close} />
					<Button type="submit" label="Save" />
				</div>
			</Form>
		</Formik>
	</Popup>;

	popups.add(popup);
}