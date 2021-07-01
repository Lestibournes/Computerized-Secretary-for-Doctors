import "./Page.css";
import { useEffect, useState } from "react";
import { Redirect, useParams } from "react-router";
import { Link } from "react-router-dom";
import { useAuth } from "../Auth";
import { DropdownMenu } from "./DropdownMenu";
import { usePopups } from "../Popups";
import { useRoot } from "../Root";
import { db } from "../../init";
import { auth } from "../../init";
import { Strings } from "../Classes/strings";

export function Header({unprotected}) {
	const authContext = useAuth();
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
		auth.onAuthStateChanged(
			state => {
				if (!unprotected && !state?.uid) setRedirect("/user/login");
			}
		)
	}, [root, unprotected]);

	useEffect(() => {
		if (authContext?.user?.uid) {
			setEmail(authContext.user.email);
			
			return db.collection("users").doc(authContext.user.uid).onSnapshot(
				user_snap => {
					setName(user_snap.data().firstName + " " + user_snap.data().lastName);
				}
			)
		}
		
	}, [authContext.user]);

	let display = <>{redirect ? <Redirect to={root.get() + redirect} /> : null }</>;

	if (email) {
		display =
			<header className="main">
				{redirect ? <Redirect to={root.get() + redirect} /> : null }
				<Link to={root.get()} className="title">{Strings.instance.get(216)}</Link>
				{name && email ?
					<div>
						<DropdownMenu label={Strings.instance.get(224)}>
							<div onClick={
								() => {
									db.collection("users").doc(authContext.user.uid).update({language: "he"})
								}}>{Strings.instance.get(221, "he")}</div>
							<div onClick={
								() => {
									db.collection("users").doc(authContext.user.uid).update({language: "ar"})
								}}>{Strings.instance.get(220, "ar")}</div>
							<div onClick={
								() => {
									db.collection("users").doc(authContext.user.uid).update({language: "en"})
								}}>{Strings.instance.get(222, "en")}</div>
						</DropdownMenu>
						<DropdownMenu label={name + " <" + email + ">"}>
							{/* <div>
								Notifications
							</div> */}
							<Link to={root.get() + "/user/appointments/list"}>{Strings.instance.get(50)}</Link>
							<Link to={root.get() + "/user/profile"}>{Strings.instance.get(38)}</Link>
							<div onClick={authContext.logout}>
								{Strings.instance.get(215)}
							</div>
						</DropdownMenu>
					</div>
				: ""}
			</header>;
	}

	return display;
}