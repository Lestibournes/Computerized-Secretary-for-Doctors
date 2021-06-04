import "./Page.css";
import React, { useContext, useEffect, useState } from "react";
import { Redirect } from "react-router";
import { useAuth } from "../Auth";
import { Link } from "react-router-dom";
import { DropdownMenu } from "./DropdownMenu";
import { usePopups } from "../Popups";

export function Page({unprotected, title, subtitle, children}) {
	const auth = useAuth();
	const popupManager = usePopups();

	const [redirect, setRedirect] = useState(false);
	
	const [name, setName] = useState();
	const [email, setEmail] = useState();

	useEffect(() => {
		popupManager.clear();
	}, []);
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!unprotected && !status) setRedirect("/general/login");
		});

		return unsubscribe;
	}, [auth, unprotected]);

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