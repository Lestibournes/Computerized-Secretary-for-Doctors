//Reactjs:
import React, { useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from "./Auth";
import { Link, Redirect } from 'react-router-dom';
import { TextInput } from './Components/TextInput';
import { Button } from './Components/Button';
import { Page } from './Components/Page';
import { Popup } from './Components/Popup';
import { usePopups } from './Popups';

export function LoginPage() {
	const auth = useAuth();
	const popupManager = usePopups();
	
	const popup = 
		<Popup key="Login" title="Login">
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
					auth.login(values.email, values.password).then(response => {
						if (!response.success) popupManager.error(response.message);
					});
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
		</Popup>;

	useEffect(() => {
		popupManager.clear();
	}, []);

	return (
		<>
			{auth.user ? <Redirect to="/general/" /> : null }
			<header className="main">
				<Link to="/" className="title">CSFPD</Link>
			</header>
			{popup}
			{popupManager.popups}
		</>
	);
}