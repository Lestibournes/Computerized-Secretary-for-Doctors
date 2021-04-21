import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { useState } from "react";
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { TextInput } from "../../../Common/Components/TextInput";
import { fn, storage } from "../../../init";
import { PictureSelector } from "./PictureSelector";

// const editClinic = fn.httpsCallable("clinics-edit");

export function UserEditForm({user, firstName, lastName, image, close, success, deleted}) {
	const [selectedImage, setSelectedImage] = useState(image);
	const [file, setFile] = useState(null);
	const [problem, setProblem] = useState(null);

	let display = 
		<Popup title="Edit Details"
			display={
				<div className="form">
					<Formik
						initialValues={{
							firstName: firstName,
							lastName: lastName,
							photo: image
						}}
						validationSchema={Yup.object({
							firstName: Yup.string(),
							lastName: Yup.string(),
							// photo: Yup.string()
						})}
						onSubmit={async (values, { setSubmitting }) => {
							setSubmitting(true);
							
							if (file) {
								storage.child("users/" + user + "/profile").put(file).then(() => {
									close();
								});
							}

							// close();

							// if (firstName) {
							// 	// update the first name.
							// }

							// if (lastName) {
							// 	// update the last name.
							// }
						}}
					>
						<Form>
							<div className="widgets">
								<TextInput
									label="First Name"
									name="firstName"
									type="text"
									placeholder="Johnathan"
								/>
								<TextInput
									label="Last Name"
									name="lastName"
									type="text"
									placeholder="Robinson"
								/>
								<PictureSelector
									src={selectedImage}
									alt="Selected"
									callback={file => {
										setFile(file);

										var temp = storage.child("users/" + user + "/temp");
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

							{problem ? <Popup title="Error" display={<div>{problem}</div>} close={() => setProblem(false)} /> : ""}
						</Form>
					</Formik>
				</div>
			}
			close={close}
		/>
	return display;
}