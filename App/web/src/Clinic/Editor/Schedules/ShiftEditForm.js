import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { server } from "../../../Common/server";
import { TextInput } from "../../../Common/Components/TextInput";
import { Time } from "../../../Common/Classes/Time";

export function ShiftEditForm({popupManager, clinic, doctor, shift, day, start, end, close, success, deleted}) {
	let deletable = start && end;

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

				const data = {
					shift: shift,
					doctor: doctor,
					clinic: clinic,
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
					server.schedules.edit(data).then(result => {
						success({
							data: data,
							success: result.data.success,
							message: result.data.message
						});
						close();
					});
				}
				else {
					server.schedules.add(data).then(result => {
						success({
							data: data,
							success: result.data.success,
							message: result.data.message
						});
						close();
					});
				}
			}}
		>
			<Form>
				<div className="widgets">
					<TextInput label="Shift Start" type="time" name="start" />
					<TextInput label="Shift End" type="time" name="end" />
				</div>
				<div className="buttonBar">
					{deletable ? 
					<Button
						type="cancel"
						label="Delete"
						action={() => {
							confirmDeletePopup(popupManager, clinic, doctor, shift, deleted ? deleted : success);
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

function ConfirmDeleteForm({popupManager, clinic, doctor, shift, close, success}) {
	return (
		<div>
			<div>
				<p>Are you sure you wish to delete this shift?</p>
				<p>This action is permanent and cannot be undone.</p>
			</div>
			<div className="buttonBar">
				<Button type="cancel" label="Yes" action={() => {
					server.schedules.delete({clinic: clinic, doctor: doctor, shift: shift}).then(response => {
						if (!response.data.success) popupManager.error(response.data.message)
						else {
							success({
								data: {clinic: clinic, doctor: doctor},
								success: true,
								message: ""
							});
							close();
						}
					});
				}} />
				<Button type="okay" label="Cancel" action={close} />
			</div>
		</div>
	);
}

export function shiftEditPopup(popupManager, clinic, doctor, shift, day, start, end, success, deleted) {
	let title = "Create New Shift";

	if (start && end) {
		title = "Edit Shift";
	}

	const close = () => {popupManager.remove(popup)};
	const popup =
		<Popup key="title" title={title} close={close}>
			<ShiftEditForm
				popupManager={popupManager}
				clinic={clinic}
				doctor={doctor}
				shift={shift}
				day={day}
				start={start}
				end={end}
				close={close}
				success={success}
				deleted={deleted}
			/>
		</Popup>;
	popupManager.add(popup);
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