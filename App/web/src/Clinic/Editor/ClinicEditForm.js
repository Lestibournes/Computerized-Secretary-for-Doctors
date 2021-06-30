import { Form, Formik } from "formik";
import { useState } from "react";
import * as Yup from 'yup';
import { Strings } from "../../Common/Classes/strings";
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
					{saving ?
						<small>{Strings.instance.get(122)}...</small>
					: ""}
				</div>
				<div className="buttonBar">
					<Button type="cancel" label={Strings.instance.get(84)}
						action={() => {
							const close = () => {popups.remove(popup)};
	
							const popup =
								<Popup key="Confirm Clinic Deletion" title={Strings.instance.get(85)} close={close}>
									<ClinicDeleteForm
										clinic={clinic}
										close={close}
										deleted={deleted}
									/>
								</Popup>;

							popups.add(popup);
						}}
					/>
					<Button label={Strings.instance.get(89)} action={close} />
					<Button type="submit" label={Strings.instance.get(101)} />
				</div>
			</Form>
		</Formik>
	);
}

export function ClinicDeleteForm({clinic, close, deleted}) {
	const popups = usePopups();
	
	return (
		<div>
			<p>{Strings.instance.get(175)}</p>
			<p>{Strings.instance.get(88)}</p>
			<div className="buttonBar">
				<Button type="cancel" label={Strings.instance.get(44)} action={() => {
					db.collection("clinics").doc(clinic.id).delete()
					.then(() => {
						deleted();
						close();
					})
					.catch(reason => popups.error(reason));
				}} />
				<Button type="okay" label={Strings.instance.get(89)} action={close} />
			</div>
		</div>
	);
}