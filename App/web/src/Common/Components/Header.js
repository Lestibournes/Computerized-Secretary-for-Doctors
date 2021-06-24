import "./Page.css";
import { useEffect, useState } from "react";
import { Redirect, useParams } from "react-router";
import { Link } from "react-router-dom";
import { useAuth } from "../Auth";
import { DropdownMenu } from "./DropdownMenu";
import { usePopups } from "../Popups";
import { useRoot } from "../Root";
import { db } from "../../init";

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
		if (!unprotected && !auth?.user?.uid) setRedirect("/user/login");
	}, [auth.user, root, unprotected]);

	useEffect(() => {
		if (auth?.user?.uid) {
			setEmail(auth.user.email);
			
			return db.collection("users").doc(auth.user.uid).onSnapshot(
				user_snap => {
					setName(user_snap.data().firstName + " " + user_snap.data().lastName);
				}
			)
		}
		
	}, [auth.user]);

	return (
		<header className="main">
			{redirect ? <Redirect to={root.get() + redirect} /> : null }
			<Link to={root.get()} className="title">CSFPD</Link>
			{name && email ?
				<div>
					<DropdownMenu label={name + " <" + email + ">"}>
						{/* <div>
							Notifications
						</div> */}
						<Link to={root.get() + "/user/appointments/list"}>My Appointments</Link>
						<Link to={root.get() + "/user/profile"}>Profile</Link>
						<div onClick={auth.logout}>
							Log Out
						</div>
					</DropdownMenu>
				</div>
			: ""}
		</header>
	)
}