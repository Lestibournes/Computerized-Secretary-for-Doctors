import "./Page.css";
import { useEffect, useState } from "react";
import { Redirect, useParams } from "react-router";
import { Link } from "react-router-dom";
import { useAuth } from "../Auth";
import { DropdownMenu } from "./DropdownMenu";
import { usePopups } from "../Popups";
import { useRoot } from "../Root";

export function Header({unprotected}) {
	const auth = useAuth();
	const popups = usePopups()
	const root = useRoot();

	const {link} = useParams();
	const [redirect, setRedirect] = useState(false);
	const [name, setName] = useState();
	const [email, setEmail] = useState();

	useEffect(() => {
		popups.clear();
	}, []);

	useEffect(() => {
		if (link) root.set(link);
	}, [root, link]);

	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!unprotected && !status) setRedirect("/" + root.get + "/login");
		});

		return unsubscribe;
	}, [auth, root, unprotected]);

	useEffect(() => {
		setName(auth?.name?.full);
		setEmail(auth?.user?.email);
	}, [auth]);

	return (
		<header className="main">
			{redirect ? <Redirect to={redirect} /> : null }
			<Link to={"/" + root.get} className="title">CSFPD</Link>
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