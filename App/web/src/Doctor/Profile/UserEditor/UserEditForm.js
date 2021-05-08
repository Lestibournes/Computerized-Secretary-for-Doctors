import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { useState } from "react";
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { TextInput } from "../../../Common/Components/TextInput";
import { fn, storage } from "../../../init";
import { RadioInput } from "../../../Common/Components/RadioInput";
import { PictureInput } from "../../../Common/Components/PictureInput";

// const editClinic = fn.httpsCallable("clinics-edit");

const updatePicture = fn.httpsCallable("users-updatePicture");
const update = fn.httpsCallable("users-update");

export function UserEditForm({user, image, close, success, deleted}) {
	const [selectedImage, setSelectedImage] = useState(image);
	const [file, setFile] = useState(null);
	const [problem, setProblem] = useState(null);

	return (
		<Popup title="Edit Details" close={close}>
			<div className="form">
				<Formik
					initialValues={{
						firstName: user.firstName,
						lastName: user.lastName,
						sex: String((user.sex && user.sex.toLowerCase() === "male") ? "Male" : "Female")
					}}
					validationSchema={Yup.object({
						firstName: Yup.string(),
						lastName: Yup.string(),
						sex: Yup.string(),
					})}
					onSubmit={async (values, { setSubmitting }) => {
						setSubmitting(true);

						const promises = [];
						
						if (file) {
							promises.push(updatePicture({id: user.id}).then(response => {
								storage.child(response.data).put(file);
							}));
						}

						const updates = {};

						if (values.firstName) updates.firstName = values.firstName;

						if (values.lastName) updates.lastName = values.lastName;

						if (values.sex) updates.sex = values.sex.toLowerCase();

						promises.push(update({id: user.id, changes: updates}));

						Promise.all(promises).then(results => {
							close();
						});
					}}
				>
					<Form>
						<div className="widgets">
							<TextInput
								label="First Name"
								name="firstName"
								type="text"
								placeholder="Jane"
							/>

							<TextInput
								label="Last Name"
								name="lastName"
								type="text"
								placeholder="Doe"
							/>

							<RadioInput
								label="Sex"
								name="sex"
								options={["Male", "Female"]}
							/>

							<PictureInput
								label="Profile Picture:"
								src={selectedImage}
								alt="Selected"
								name="photo"
								callback={file => {
									setFile(file);

									var temp = storage.child("users/" + user.id + "/pictures/temp");
									temp.put(file).then(() => {
										temp.getDownloadURL().then(url => {
											setSelectedImage(url);
										});
									});

								}}
							/>

						</div>

						<div className="buttonBar">
							<Button label="Cancel" action={close} />
							<Button type="submit" label="Save" />
						</div>

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