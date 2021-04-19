//Reactjs:
import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from "./Auth";
import { Link, Redirect } from 'react-router-dom';
import { TextInput } from './Components/TextInput';
import { Button } from './Components/Button';
import { Page } from './Components/Page';
import { Popup } from './Components/Popup';

export function LoginPage() {
	const auth = useAuth();
	
	return (
		<>
			{auth.user ? <Redirect to="/general/" /> : null }
			<Page
				unprotected
				content={
					<Popup
						name="Login"
						title="Login"
						display={
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
									<div className="widgets">
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
									</div>
									<div className="buttonBar">
										<Button link="/general/register" label="Register" />
										<Button type="submit" label="Login" />
									</div>
								</Form>
							</Formik>
						}
					/>
				}
			/>
		</>
	);
}