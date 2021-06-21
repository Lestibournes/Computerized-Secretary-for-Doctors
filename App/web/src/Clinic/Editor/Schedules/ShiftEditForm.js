import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { TextInput } from "../../../Common/Components/TextInput";
import { Time } from "../../../Common/Classes/Time";
import { db } from "../../../init";
import { useState } from "react";
import { usePopups } from "../../../Common/Popups";

export function ShiftEditForm({clinic, doctor, shift, close}) {
	const popups = usePopups();

	let deletable = shift.start && shift.end;
	const [saving, setSaving] = useState(false);

	return (
		<Formik
			initialValues={{
				start: (shift.start ? Time.fromDate(shift.start.toDate()).toString() : ""),
				end: (shift.end ? Time.fromDate(shift.end.toDate()).toString() : ""),
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
					start: start.toDate(),
					end: end.toDate(),
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
					<TextInput label="Shift Start" type="time" name="start" />
					<TextInput label="Shift End" type="time" name="end" />
				{saving ?
					<div>Saving...</div>
				: ""}
				</div>
				<div className="buttonBar">
					{deletable ? 
					<Button
						type="cancel"
						label="Delete"
						action={() => {
							close();

							const cancel = () => {popups.remove(popup)};

							const popup =
								<Popup key={"Confirm Shift Deletion" + shift.id} title="Confirm Deletion" close={cancel}>
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
					<Button label="Cancel" action={close} />
					<Button type="submit" label="Save" />
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
				<p>Are you sure you wish to delete this shift?</p>
				<p>This action is permanent and cannot be undone.</p>
				{saving ?
				<small>Saving...</small>
				: ""}
			</div>
			<div className="buttonBar">
				<Button type="cancel" label="Yes" action={() => {
					setSaving(true);
					
					db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("shifts").doc(shift.id).delete()
					.then(close)
					.catch(reason => {
						setSaving(false)
						popups.error(reason.message);
					});
				}} />
				<Button type="okay" label="Cancel" action={close} />
			</div>
		</div>
	);
}