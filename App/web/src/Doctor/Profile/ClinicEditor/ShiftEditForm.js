import { Field, Form, Formik } from "formik";
import * as Yup from 'yup';
import { useState } from "react";
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { server } from "../../../Common/server";
import { TextInput } from "../../../Common/Components/TextInput";
import { Time } from "../../../Common/classes";

export function ShiftEditForm({clinic, doctor, shift, day, start, end, close, success, deleted}) {
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [problem, setProblem] = useState(null);

	let title = "Create New Shift";
	let deletable = false;

	if (start && end) {
		title = "Edit Shift";
		deletable = true;
	}

	return (
		<Popup title={title} close={close}>
			<div className="form">
				<Formik
					initialValues={{
						start: (start ? Time.fromObject(start).toString() : ""),
						end: (end ? Time.fromObject(end).toString() : ""),
					}}
					validationSchema={Yup.object({
						
					})}
					onSubmit={async (values, { setSubmitting }) => {
						setSubmitting(true);

						success({
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
						});
					}}
				>
					<Form>
						<div className="widgets">
							<TextInput label="Shift Start" type="time" name="start" />
							<TextInput label="Shift End" type="time" name="end" />
						</div>
						<div className="buttonBar">
							{deletable ? 
							<Button type="cancel" label="Delete" action={() => setConfirmDelete(true)} />
							: ""}
							<Button label="Cancel" action={close} />
							<Button type="submit" label="Save" />
						</div>
						{confirmDelete ? <ConfirmDelete
								clinic={clinic}
								doctor={doctor}
								shift={shift}
								close={() => setConfirmDelete(false)}
								success={deleted} />
							: ""}
						{problem ?
							<Popup title="Error" close={() => setProblem(false)}>
								<div>{problem}</div>
							</Popup>
						: ""}
					</Form>
				</Formik>
			</div>

		</Popup>
	);
}

function ConfirmDelete({clinic, doctor, shift, close, success}) {
	const [problem, setProblem] = useState(null);

	return (
	<Popup title="Confirm Deletion" close={close}>
		<div>
			<p>Are you sure you wish to delete this shift?</p>
			<p>This action is permanent and cannot be undone.</p>
		</div>
		<div className="buttonBar">
			<Button type="cancel" label="Yes" action={() => {
				server.schedules.delete({clinic: clinic, doctor: doctor, shift: shift}).then(response => {
					if (!response.data.success) {setProblem(response.data.message)}
					else {success()}
				});
			}} />
			<Button type="okay" label="Cancel" action={close} />
			{problem ?
				<Popup title="Error" close={() => setProblem(false)}>
					<div>{problem}</div>
				</Popup>
			: ""}
		</div>
	</Popup>
	);
}