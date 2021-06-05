import "./Page.css";
import React, { useContext, useEffect, useState } from "react";
import { Redirect } from "react-router";
import { useAuth } from "../Auth";
import { Link } from "react-router-dom";
import { DropdownMenu } from "./DropdownMenu";
import { usePopups } from "../Popups";
import { events, server } from "../server";

export function Page({unprotected, title, subtitle, children}) {
	const auth = useAuth();
	const popupManager = usePopups();

	const [redirect, setRedirect] = useState(false);
	
	const [name, setName] = useState();
	const [email, setEmail] = useState();
	const [doctor, setDoctor] = useState(null);

	useEffect(() => {
		popupManager.clear();
	}, []);
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!unprotected && !status) setRedirect("/general/login");
		});

		if (auth.user && doctor === null) {
			server.doctors.getID({user: auth.user.uid}).then(response => {
				if (response.data) {
					server.doctors.getData({id: response.data}).then(results => {
						setDoctor(results.data);
					});
				}
				else {
					setDoctor(false);
				}
			});
		}

		return unsubscribe;
	}, [auth, doctor, unprotected]);

	useEffect(() => {
		if (doctor) {
			return events.doctors.arrival(doctor.doctor.id, appointment => {
				if (appointment.arrived) {
					server.users.get({user: appointment.patient}).then(response => {
						alert(response.data.fullName + " is here");
					});
				}
			});
		}
	}, [doctor])

	useEffect(() => {
		setName(auth?.name?.full);
		setEmail(auth?.user?.email);
	}, [auth]);

	return (
		<>
			<div className="Page">
				{redirect ? <Redirect to={redirect} /> : null }
				<header className="main">
					<Link to="/" className="title">CSFPD</Link>
					{name && email ?
						<div>
							<DropdownMenu label={name + " <" + email + ">"}>
								<div>
									Notifications
								</div>
								<Link to={"/general/profile"}>Profile</Link>
								<div onClick={auth.logout}>
									Log Out
								</div>
							</DropdownMenu>
						</div>
					: ""}
				</header>
				{title ? <h1>{title}</h1> : ""}
				{subtitle ? <h2>{subtitle}</h2> : ""}
				{children ? (auth ? children : <h3>Loading...</h3>) : ""}
			</div>
			{/* {popups ? popups : ""} */}
			{popupManager.popups}
		</>
	);
}