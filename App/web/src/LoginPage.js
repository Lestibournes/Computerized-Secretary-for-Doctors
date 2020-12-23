//Reactjs:
import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput, MainHeader } from "./CommonComponents";
import { fb, db } from "./init";

fb.auth().signOut();

export class LoginPage extends React.Component {
	render() {
		return (
			<div className="page">
				<MainHeader section="Login"></MainHeader>
				<div className="content">
					<div className="form">
						<Formik
							initialValues={{
								email: "",
								password: ""
							}}
							validationSchema={Yup.object({
								email: Yup.string()
									.email("Invalid email addresss")
									.required("Required"),
								password: Yup.string()
									.min(4, "Must be 4 characters or more")
									.max(32, "Must be 32 characters or less")
									.required("Required")
							})}
							onSubmit={async (values, { setSubmitting }) => {
								setSubmitting(true);

								fb.auth().signInWithEmailAndPassword(values.email, values.password)
									.then((user) => {
										console.log("email: " + fb.auth().currentUser.email);
										console.log("email verification: " + fb.auth().currentUser.emailVerified);
										//redirect to main page
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
								<div className="panel">
									<button>Register</button>
									<button className="okay" type="submit">Login</button>
								</div>
							</Form>
						</Formik>
					</div>
				</div>
			</div>
		);
	}
}