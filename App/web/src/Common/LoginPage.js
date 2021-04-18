//Reactjs:
import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from "./CommonComponents";
import { Link, Redirect } from 'react-router-dom';
import { TextInput } from './Components/TextInput';
import { MainHeader } from './Components/MainHeader';

export function LoginPage() {
	const auth = useAuth();
	
	return (
		<>
			{auth.user ? <Redirect to="/general/" /> : null }
			<MainHeader section="Login"></MainHeader>
			<div className="center">
				<div className="form">
					<h1>Login</h1>
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
							auth.login(values.email, values.password);
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
								<Link className="button" to="/general/register">Register</Link>
								<button className="okay" type="submit">Login</button>
							</div>
						</Form>
					</Formik>
				</div>
			</div>
		</>
	);
}