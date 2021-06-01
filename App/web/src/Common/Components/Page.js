import "./Page.css";
import { useEffect, useState } from "react";
import { Redirect } from "react-router";
import { useAuth } from "../Auth";
import { Link } from "react-router-dom";
import { Button } from "./Button";

export function Page({unprotected, title, subtitle, popupManager, children}) {
	const auth = useAuth();
	const [redirect, setRedirect] = useState(false);
	
	const [popups, setPopups] = useState(new Map());
	const [pops, setPops] = useState([]);

	useEffect(() => {
		if (popupManager) {
			popupManager.add = (popup) => {
				if (!popups.has(popup.key)) {
					const popup_map = new Map();

					for (const entry of popups.entries()) {
						popup_map.set(entry[0], entry[1]);
					}

					popup_map.set(popup.key, popup);
					setPopups(popup_map);

					const popup_array = [];

					for (const entry of popup_map) {
						popup_array.push(entry[1]);
					}

					setPops(popup_array);
				}
				// let exists = false;
		
				// for (const old_popup of popups) {
				// 	if (old_popup.key === popup.key) {
				// 		exists = true;
				// 	}
				// }
				
				// if (!exists) {
				// 	const new_popups = [...popups];
				// 	new_popups.push(popup);
				// 	console.log(popups);
				// 	setPopups(new_popups);
				// }
			}
		
			popupManager.remove = (popup) => {
				if (popups.has(popup.key)) {
					const popup_map = new Map();

					for (const entry of popups.entries()) {
						if (entry[0] !== popup.key) popup_map.set(entry[0], entry[1]);
					}

					setPopups(popup_map);

					const popup_array = [];

					for (const entry of popup_map) {
						popup_array.push(entry[1]);
					}

					setPops(popup_array);
				}
				// const new_popups = [];
		
				// for (const p of popups) {
				// 	if (p !== popup) {
				// 		new_popups.push(p);
				// 	}
				// }
		
				// setPopups(new_popups);
			}
		}
	}, [popupManager, popups]);

	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!unprotected && !status) setRedirect("/general/login");
		});

		return unsubscribe;
	}, [auth, unprotected]);

	return (
		<>
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
				{title ? <h1>{title}</h1> : ""}
				{subtitle ? <h2>{subtitle}</h2> : ""}
				{children ? children : <h3>Loading...</h3>}
			</div>
			{pops ? pops : ""}
		</>
	);
}