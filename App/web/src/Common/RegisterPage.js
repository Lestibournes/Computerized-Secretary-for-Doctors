//Reactjs:
import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from "./Auth";
import { Link, Redirect, useParams } from 'react-router-dom';
import { TextInput } from './Components/TextInput';
import { RadioInput } from './Components/RadioInput';
import { Button } from './Components/Button';
import { Popup } from './Components/Popup';
import { usePopups } from './Popups';
import { useRoot } from './Root';

export function RegisterPage() {
	const auth = useAuth();
	const popups = usePopups();
	const root = useRoot();

	const {link} = useParams();

	const [redirect, setRedirect] = useState(false);

	useEffect(() => {
		popups.clear();
	}, []);

	useEffect(() => {
		if (link) root.set(link);
	}, [root, link]);

	const popup =
		<Popup key="Register" title="Register">
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
					sex: Yup.string()
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

					auth.register(values.fname, values.lname, values.sex.toLowerCase(), values.email, values.password).then(response => {
						if (response.success) {
							setRedirect(true);
						}
						else {
							popups.error(response.message);
						}
					});
				}}
			>
				<Form>
					<div className="widgets">
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
						<RadioInput
							label="Sex"
							name="sex"
							options={["Male", "Female"]}
						/>
					</div>
					<div className="buttonBar">
						<Button link={root.get() + "/user/login"} label="Login" />
						<Button type="submit" label="Register" />
					</div>
				</Form>
			</Formik>
		</Popup>;

	return (
		<>
			{redirect ? <Redirect to={root.get()} /> : null }
			<header className="main">
				<Link to={root.get()} className="title">CSFPD</Link>
			</header>
			{popup}
			{popups.popups}
		</>
	);
}