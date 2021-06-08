import "./Page.css";
import React, { useEffect, useState } from "react";
import { Redirect } from "react-router";
import { useAuth } from "../Auth";
import { Link } from "react-router-dom";
import { DropdownMenu } from "./DropdownMenu";
import { usePopups } from "../Popups";
import { events, server } from "../server";
import { Time } from "../Classes/Time";
import { SimpleDate } from "../Classes/SimpleDate";
import { notify } from "../functions";

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
			return events.doctors.arrival(doctor.doctor.id, (appointment_id, arrived) => {
				if (arrived) {
					server.appointments.get({id: appointment_id}).then(response => {
						const data = response.data.data;
						notify(
							"Patient " + data.patient.fullName +
							" has arrived for " + (data.patient.sex === "male" ? "his " : "her ") +
							SimpleDate.fromObject(data.extra.date) + " " +
							Time.fromObject(data.extra.time).toString() +
							" appointment.", "/specific/doctor/appointments/details/" + appointment_id);
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
								{/* <div>
									Notifications
								</div> */}
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

			{popupManager.popups}
		</>
	);
}