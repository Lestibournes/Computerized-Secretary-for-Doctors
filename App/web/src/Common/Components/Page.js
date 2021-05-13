import "./Page.css";
import { useEffect, useState } from "react";
import { Redirect } from "react-router";
import { useAuth } from "../Auth";
import { Link } from "react-router-dom";
import { Button } from "./Button";

export function Page({unprotected, title, subtitle, popups, children}) {
	const auth = useAuth();
	const [redirect, setRedirect] = useState(false);
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!unprotected && !status) setRedirect("/general/login");
		});

		return unsubscribe;
	}, [auth, unprotected]);

	return (
		<div className="Page">
			{redirect ? <Redirect to={redirect} /> : null }
			<div className="mainHeader">
				<Link to="/general/" className="title">CSFPD</Link>
				<div>
					{auth.user ? 
					<>
						{auth.name.first ? auth.name.first + " " : null}
						{auth.name.last ? auth.name.last + " " : null}
						{auth.user ? "<" + auth.user.email + ">" : null}
						<Button type="cancel" action={auth.logout} label="Log out" />
					</>
					: null}
				</div>
			</div>
			{popups ? popups : ""}
			{title ? <h1>{title}</h1> : ""}
			{subtitle ? <h2>{subtitle}</h2> : ""}
			{children ? children : <h3>Loading...</h3>}
		</div>
	);
}