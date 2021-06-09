import "./Page.css";
import { useEffect, useState } from "react";
import { Redirect } from "react-router";
import { Link } from "react-router-dom";
import { useAuth } from "../Auth";
import { DropdownMenu } from "./DropdownMenu";
import { usePopups } from "../Popups";

export function Header({link, unprotected}) {
	const auth = useAuth();
	const popups = usePopups()

	const [redirect, setRedirect] = useState(false);
	const [name, setName] = useState();
	const [email, setEmail] = useState();

	useEffect(() => {
		popups.clear();
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
		<header className="main">
			{redirect ? <Redirect to={redirect} /> : null }
			<Link to={"/" + (link ? link : "")} className="title">CSFPD</Link>
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
	)
}