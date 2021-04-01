//Reactjs:
import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { TextInput, MainHeader, useAuth } from "../../Common/CommonComponents";
import { Link, Redirect } from 'react-router-dom';

export function ClinicEditor() {
	const auth = useAuth();
	
	return (
		<div className="page">
			{!auth.user ? <Redirect to="/login" /> : null }
			<MainHeader section="Register"></MainHeader>
			<div className="center">
				<div className="form">
					<h1>Doctor Profile</h1>
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

							auth.register(values.fname, values.lname, values.email, values.password);
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
								<Link className="button" to="/login">Login</Link>
								<button className="okay" type="submit">Register</button>
							</div>
						</Form>
					</Formik>
				</div>
			</div>
		</div>
	);
}