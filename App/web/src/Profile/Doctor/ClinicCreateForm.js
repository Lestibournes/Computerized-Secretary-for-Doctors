import { Button } from "../../Common/Components/Button";
import { Popup } from "../../Common/Components/Popup";

import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput } from '../../Common/Components/TextInput';
import { db } from "../../init";
import { usePopups } from "../../Common/Popups";
import { Strings } from "../../Common/Classes/strings";

export function ClinicCreateForm({doctor, close}) {
	const popups = usePopups();

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

				db.collection("clinics").add({owner: doctor, name: values.name, city: values.city, address: values.address})
				.then(clinicRef => {
					clinicRef.collection("doctors").doc(doctor).set({user: doctor, clinic: clinicRef.id, minimum: 15})
					.then(close)
					.catch(reason => popups.error(reason.message));
				})
				.catch(reason => popups.error(reason.message));
			}}
		>
			<Form>
				<div className="widgets">
					<TextInput
						label={Strings.instance.get(145)}
						name="name"
						type="text"
						placeholder={Strings.instance.get(147)}
					/>
					<TextInput
						label={Strings.instance.get(75)}
						name="city"
						type="text"
						placeholder={Strings.instance.get(148)}
					/>
					<TextInput
						label={Strings.instance.get(146)}
						name="address"
						type="text"
						placeholder={Strings.instance.get(149)}
					/>
				</div>
				<div className="buttonBar">
					<Button label={Strings.instance.get(89)} action={close} />
					<Button type="submit" label={Strings.instance.get(101)} />
				</div>
			</Form>
		</Formik>
	);
}