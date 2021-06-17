import { Form, Formik } from "formik";
import * as Yup from 'yup';
import { useState } from "react";
import { Button } from "../../Common/Components/Button";
import { Popup } from "../../Common/Components/Popup";
import { TextInput } from "../../Common/Components/TextInput";
import { db, storage } from "../../init";
import { RadioInput } from "../../Common/Components/RadioInput";
import { PictureInput } from "../../Common/Components/PictureInput";
import { server } from "../../Common/server";

export function UserEditForm({popupManager: popups, user, data, image, close, success}) {
	const [selectedImage, setSelectedImage] = useState(image);
	const [file, setFile] = useState(null);

	return (
		<Formik
			initialValues={{
				firstName: data.firstName,
				lastName: data.lastName,
				sex: String((data.sex && data.sex.toLowerCase() === "male") ? "Male" : "Female")
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
					// Decide the file name for the picture:
					let current = 0;

					await db.collection("users").doc(id).get().then(user_snap => {
						if (user_snap.data().image) current = user_snap.data().image;
					});

					current++;

					promises.push(
						db.collection("users").doc(id).update({image: current})
						.catch(reason => popups.error(reason.message))
					);

					promises.push(
						storage.child("users/" + id + "/pictures/" + current).put(file)
						.catch(error => popups.error(error.message))
					);
				}

				const updates = {};

				if (values.firstName) updates.firstName = values.firstName;

				if (values.lastName) updates.lastName = values.lastName;

				if (values.sex) updates.sex = values.sex.toLowerCase();

				promises.push(
					db.collection("users").doc(user).update(updates)
					.catch(reason => popups.error(reason.message))
				)

				Promise.all(promises).then(() => {
					success();
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

							var temp = storage.child("users/" + user + "/pictures/temp");
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
			</Form>
		</Formik>
	);
}

export function userEditPopup(popupManager, user, data, image, success) {
	const close = () => {
		popupManager.remove(popup);
	};

	const popup = 
	<Popup
		key="Edit User Profile"
		title="Edit User Profile"
		close={close}
	>
		<UserEditForm
			popupManager={popupManager}
			success={success} close={close}
			user={user} data={data} image={image}
		/>
	</Popup>;

	popupManager.add(popup);
}