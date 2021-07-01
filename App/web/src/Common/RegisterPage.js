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
import { Strings } from './Classes/strings';

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
		<Popup key="Register" title={Strings.instance.get(211)}>
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

					auth.register(values.fname, values.lname, values?.sex?.toLowerCase() === Strings.instance.get(103).toLowerCase() ? "male" : "female", values.email, values.password).then(response => {
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
							label={Strings.instance.get(113)}
							name="fname"
							type="text"
							placeholder={Strings.instance.get(212)}
						/>
						<TextInput
							label={Strings.instance.get(114)}
							name="lname"
							type="text"
							placeholder={Strings.instance.get(213)}
						/>
						<TextInput
							label={Strings.instance.get(209)}
							name="email"
							type="email"
							placeholder="john.doe@csfpd.com"
						/>
						<TextInput
							label={Strings.instance.get(210)}
							name="password"
							type="password"
						/>
						<TextInput
							label={Strings.instance.get(214)}
							name="vpassword"
							type="password"
						/>
						<RadioInput
							label={Strings.instance.get(67) + ":"}
							name="sex"
							options={[Strings.instance.get(103), Strings.instance.get(104)]}
						/>
					</div>
					<div className="buttonBar">
						<Button link={root.get() + "/user/login"} label={Strings.instance.get(208)} />
						<Button type="submit" label={Strings.instance.get(211)} />
					</div>
				</Form>
			</Formik>
		</Popup>;

	return (
		<>
			{redirect ? <Redirect to={root.get()} /> : null }
			<header className="main">
				<Link to={root.get()} className="title">{Strings.instance.get(216)}</Link>
			</header>
			{popup}
			{popups.popups}
		</>
	);
}