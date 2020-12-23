//Reactjs:
import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput, MainHeader } from "./CommonComponents";
import { fb, db } from "./init";

export class RegisterPage extends React.Component {
	render() {
		return (
			<div className="page">
				<MainHeader section="Register"></MainHeader>
				<div className="content">
					<div className="form">
						<Formik
							initialValues={{
								fname: "",
								lname: "",
								email: "",
								password: "",
								vpassword: ""
							}}
							validationSchema={Yup.object({
								fname: Yup.string()
									.required("Required"),
								lname: Yup.string()
									.required("Required"),
								email: Yup.string()
									.email("Invalid email addresss")
									.required("Required"),
								password: Yup.string()
									.min(4, "Must be 4 characters or more")
									.max(32, "Must be 32 characters or less")
									.required("Required"),
								vpassword: Yup.string()
									.min(4, "Must be 4 characters or more")
									.max(32, "Must be 32 characters or less")
									.required("Required")
									.oneOf([Yup.ref('password'), null], 'Passwords must match')
							})}
							onSubmit={async (values, { setSubmitting }) => {
								setSubmitting(true);

								fb.auth().createUserWithEmailAndPassword(values.email, values.password)
									.then((user) => {
										db.collection("users").add({
											first: values.fname,
											last: values.lname,
											uid: user.user.uid
										})
										.then(function(docRef) {
											user.user.sendEmailVerification();
										})
										.catch(function(error) {
											console.error("Error adding document: ", error);
										});

										//redirect to login page
									})
									.catch((error) => {
										var errorCode = error.code;
										var errorMessage = error.message;
										console.error(errorCode + " - " + errorMessage);
										// ..
									});
							}}
						>
							<Form>
								<TextInput
									label="First Name"
									name="fname"
									type="text"
									placeholder="John"
								/>
								<TextInput
									label="Last Name"
									name="lname"
									type="text"
									placeholder="Doe"
								/>
								<TextInput
									label="Email Address"
									name="email"
									type="email"
									placeholder="john.doe@csfpd.com"
								/>
								<TextInput
									label="Password"
									name="password"
									type="password"
								/>
								<TextInput
									label="Verify Password"
									name="vpassword"
									type="password"
								/>
								<div className="panel">
									<button>Login</button>
									<button className="okay" type="submit">Register</button>
								</div>
							</Form>
						</Formik>
					</div>
				</div>
			</div>
		);
	}
}