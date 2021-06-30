import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { TextInput } from "../../../Common/Components/TextInput";
import { Time } from "../../../Common/Classes/Time";
import { db } from "../../../init";
import { useState } from "react";
import { usePopups } from "../../../Common/Popups";
import { Strings } from "../../../Common/Classes/strings";

export function ShiftEditForm({clinic, doctor, shift, close}) {
	const popups = usePopups();

	let deletable = shift.start && shift.end;
	const [saving, setSaving] = useState(false);

	return (
		<Formik
			initialValues={{
				start: (shift.start ? Time.fromObject(shift.start).toString() : ""),
				end: (shift.end ? Time.fromObject(shift.end).toString() : ""),
			}}
			validationSchema={Yup.object({
				
			})}
			onSubmit={async (values, { setSubmitting }) => {
				setSubmitting(true);
				setSaving(true);

				const start = new Time(
					Number(values.start.split(":")[0]),
					Number(values.start.split(":")[1])
				);

				const end = new Time(
					Number(values.end.split(":")[0]),
					Number(values.end.split(":")[1])
				);

				const data = {
					day: shift.day,
					start: start.toObject(),
					end: end.toObject(),
				}

				if (shift.id) {
					db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("shifts").doc(shift.id).update(data)
					.then(close)
					.catch(reason => {
						popups.error(reason.message);
						setSaving(false);
					});
				}
				else {
					db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("shifts").add(data)
					.then(close)
					.catch(reason => {
						popups.error(reason.message);
						setSaving(false);
					});
				}
			}}
		>
			<Form>
				<div className="widgets">
					<TextInput label={Strings.instance.get(170)} type="time" name="start" />
					<TextInput label={Strings.instance.get(171)} type="time" name="end" />
				{saving ?
					<div>{Strings.instance.get(122)}...</div>
				: ""}
				</div>
				<div className="buttonBar">
					{deletable ? 
					<Button
						type="cancel"
						label={Strings.instance.get(84)}
						action={() => {
							close();

							const cancel = () => {popups.remove(popup)};

							const popup =
								<Popup key={"Confirm Shift Deletion" + shift.id} title={Strings.instance.get(85)} close={cancel}>
									<ConfirmDeleteForm
										clinic={clinic}
										doctor={doctor}
										shift={shift}
										close={cancel}
									/>
								</Popup>;

							popups.add(popup);
						}}
					/>
					: ""}
					<Button label={Strings.instance.get(89)} action={close} />
					<Button type="submit" label={Strings.instance.get(101)} />
				</div>
			</Form>
		</Formik>
	);
}

function ConfirmDeleteForm({clinic, doctor, shift, close}) {
	const popups = usePopups();

	const [saving, setSaving] = useState(false);

	return (
		<div>
			<div>
				<p>{Strings.instance.get(172)}</p>
				<p>{Strings.instance.get(88)}</p>
				{saving ?
				<small>{Strings.instance.get(122)}...</small>
				: ""}
			</div>
			<div className="buttonBar">
				<Button type="cancel" label={Strings.instance.get(44)} action={() => {
					setSaving(true);
					
					db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("shifts").doc(shift.id).delete()
					.then(close)
					.catch(reason => {
						setSaving(false)
						popups.error(reason.message);
					});
				}} />
				<Button type="okay" label={Strings.instance.get(89)} action={close} />
			</div>
		</div>
	);
}