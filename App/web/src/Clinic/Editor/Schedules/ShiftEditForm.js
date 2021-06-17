import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { server } from "../../../Common/server";
import { TextInput } from "../../../Common/Components/TextInput";
import { Time } from "../../../Common/Classes/Time";
import { db } from "../../../init";
import { useState } from "react";

export function ShiftEditForm({popups, clinic, doctor, shift, day, start, end, close}) {
	let deletable = start && end;
	const [saving, setSaving] = useState(false);

	return (
		<Formik
			initialValues={{
				start: (start ? Time.fromObject(start).toString() : ""),
				end: (end ? Time.fromObject(end).toString() : ""),
			}}
			validationSchema={Yup.object({
				
			})}
			onSubmit={async (values, { setSubmitting }) => {
				setSubmitting(true);
				setSaving(true);
				const data = {
					day: day,
					start: {
						hours: Number(values.start.split(":")[0]),
						minutes: Number(values.start.split(":")[1])
					},
					end: {
						hours: Number(values.end.split(":")[0]),
						minutes: Number(values.end.split(":")[1])
					},
				}

				if (shift) {
					db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("shifts").doc(shift).update(data)
					.then(() => close())
					.catch(reason => popups.error(reason.code));
				}
				else {
					db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("shifts").add(data)
					.then(() => close())
					.catch(reason => popups.error(reason.code));
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
							confirmDeletePopup(popups, clinic, doctor, shift);
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

function ConfirmDeleteForm({popups, clinic, doctor, shift, close}) {
	return (
		<div>
			<div>
				<p>Are you sure you wish to delete this shift?</p>
				<p>This action is permanent and cannot be undone.</p>
			</div>
			<div className="buttonBar">
				<Button type="cancel" label="Yes" action={() => {
					db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("shifts").doc(shift).delete()
					.then(() => close())
					.catch(reason => popups.error(reason.code));
				}} />
				<Button type="okay" label="Cancel" action={close} />
			</div>
		</div>
	);
}

export function shiftEditPopup(popups, clinic, doctor, shift, day, start, end) {
	let title = "Create New Shift";

	if (start && end) {
		title = "Edit Shift";
	}

	const close = () => {popups.remove(popup)};
	const popup =
		<Popup key="title" title={title} close={close}>
			<ShiftEditForm
				popupManager={popups}
				clinic={clinic}
				doctor={doctor}
				shift={shift}
				day={day}
				start={start}
				end={end}
				close={close}
			/>
		</Popup>;
	popups.add(popup);
}

export function confirmDeletePopup(popupManager, clinic, doctor, shift, success) {
	const close = () => {popupManager.remove(popup)};
	const popup =
		<Popup key="Confirm Shift Deletion" title="Confirm Deletion" close={close}>
			<ConfirmDeleteForm
				popupManager={popupManager}
				clinic={clinic}
				doctor={doctor}
				shift={shift}
				close={close}
				success={success}
			/>
		</Popup>;
	popupManager.add(popup);
}