//Reactjs:
import React, { useEffect, useRef, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from "./Auth";
import { Link, Redirect, useParams } from 'react-router-dom';
import { TextInput } from './Components/TextInput';
import { Button } from './Components/Button';
import { Popup } from './Components/Popup';
import { usePopups } from './Popups';
import { useRoot } from './Root';
import { Strings } from './Classes/strings';
import { auth } from '../init';

export function LoginPage() {
	const authContext = useAuth();
	const popups = usePopups();
	const root = useRoot();
	const ref = useRef(null);

	const {link} = useParams();

	const popup = 
		<Popup key="Login" title={Strings.instance.get(208)}>
			<Formik
				innerRef={ref}
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

					authContext.login(values.email, values.password).then(response => {
						if (!response.success) popups.error(response.message);
					});
				}}
			>
				<Form>
					<div className="widgets">
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
						<Link onClick={() => {
							auth.sendPasswordResetEmail(ref.current.values.email).then(() => {
								const close = () => popups.remove(popup);

								const popup =
									<Popup key="Sending Password Reset Email" title={Strings.instance.get(225)} close={close}>
										<p>
											{Strings.instance.get(226)}
										</p>
										<Button action={close} label={Strings.instance.get(138)} />
									</Popup>

								popups.add(popup);
							})
						}}>{Strings.instance.get(227)}</Link>
					</div>
					<div className="buttonBar">
						<Button link={root.get() + "/user/register"} label={Strings.instance.get(211)} />
						<Button type="submit" label={Strings.instance.get(208)} />
					</div>
				</Form>
			</Formik>
		</Popup>;

	useEffect(() => {
		popups.clear();
	}, []);

	useEffect(() => {
		if (link) root.set(link);
	}, [root, link]);

	return (
		<>
			{authContext.user ? <Redirect to={root.get()} /> : null }
			<header className="main">
				<Link to={root.get()} className="title">{Strings.instance.get(216)}</Link>
			</header>
			{popup}
			{popups.popups}
		</>
	);
}