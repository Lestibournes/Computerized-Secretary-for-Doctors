import { Field, Form, Formik } from "formik";
import * as Yup from 'yup';
import { useState } from "react";
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { fn } from "../../../init";

export function ShiftEditForm({clinic, doctor, shift, day, start, end, min, close, success, deleted}) {
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [problem, setProblem] = useState(null);

	let title = "Create New Shift";
	let deletable = false;

	if (start && end && min) {
		title = "Edit Shift";
		deletable = true;
	}

	return (
		<Popup title={title} close={close}>
			<div className="form">
				<Formik
					initialValues={{
						start_hours: (start ? start.hours : 0),
						start_minutes: (start ? start.minutes : 0),
						end_hours: (end ? end.hours : 0),
						end_minutes: (end ? end.minutes : 0),
						min: (min ? min : 0)
					}}
					validationSchema={Yup.object({
						start_hours: Yup.number().min(0).max(23),
						start_minutes: Yup.number().min(0).max(59),
						end_hours: Yup.number().min(0).max(23),
						end_minutes: Yup.number().min(0).max(59),
						min: Yup.number().min(0),
					})}
					onSubmit={async (values, { setSubmitting }) => {
						setSubmitting(true);

						success({
							doctor: doctor,
							clinic: clinic,
							day: day,
							start: {
								hours: values.start_hours,
								minutes: values.start_minutes
							},
							end: {
								hours: values.end_hours,
								minutes: values.end_minutes
							},
							min: values.min
						});
					}}
				>
					<Form>
						<div className="widgets">
							<label htmlFor="start_hours">Start hours:</label>
							<Field type="number" name="start_hours" max="23" min="0" />

							<label htmlFor="start_minutes">Start minutes:</label>
							<Field type="number" name="start_minutes" max="59" min="0" />

							<label htmlFor="end_hours">End hours:</label>
							<Field type="number" name="end_hours" max="23" min="0" />

							<label htmlFor="end_minutes">End minutes:</label>
							<Field type="number" name="end_minutes" max="59" min="0" />

							<label htmlFor="min">Minimum timeslot (in minutes):</label>
							<Field type="number" name="min" min="0" />
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

const deleteShift = fn.httpsCallable("schedules-delete");

function ConfirmDelete({clinic, doctor, shift, close, success}) {
	const [problem, setProblem] = useState(null);

	return (
	<Popup title="Confirm Deletion" close={close}>
		<p>Are you sure you wish to delete this shift?</p>
		<p>This action is permanent and cannot be undone.</p>
		<div className="buttonBar">
			<Button type="cancel" label="Yes" action={() => {
				deleteShift({clinic: clinic, doctor: doctor, shift: shift}).then(response => {
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