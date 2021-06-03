import "./Page.css";
import React, { useContext, useEffect, useState } from "react";
import { Redirect } from "react-router";
import { useAuth } from "../Auth";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { server } from "../server";
import { DropdownMenu } from "./DropdownMenu";

export function Page({unprotected, title, subtitle, children}) {
	const auth = useAuth();
	const popupManager = usePopups();

	const [redirect, setRedirect] = useState(false);
	
	const [popups, setPopups] = useState([]);
	
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
					<Link to="/general/" className="title">CSFPD</Link>
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

export const PopupContext = React.createContext();


// Put this component at the root of any component tree in which you want to use popups:
export function ProvidePopups({children}) {
	const popupManager = useProvidePopups();
	return <PopupContext.Provider value={popupManager}>{children}</PopupContext.Provider>
}

// Include this inside components that want to access user authentication services:
export const usePopups = () => {
	return useContext(PopupContext);
}

function useProvidePopups() {
	const [popups, setPopups] = useState(new Map());
	const [popupArray, setPopupArray] = useState([]);

	useEffect(() => {
		// Update the display of the popups:
		const popup_array = [];

		for (const entry of popups) {
			popup_array.push(entry[1]);
		}

		setPopupArray(popup_array);
	}, [popups]);

	const add = (popup) => {
		// Only allow 1 popup to be added per key. If the key is already used, don't add the popup.
		if (!popups.has(popup.key)) {
			const popup_map = new Map(popups);
			popup_map.set(popup.key, popup);
			setPopups(popup_map);
		}
	}

	const remove = (popup) => {
		// Find the popup that has the specified key and remove it:
		const popup_map = new Map(popups);
		popup_map.delete(popup.key);
		setPopups(popup_map);
	}

	const clear = () => {
		setPopups(new Map());
	}

	return {
		popups: popupArray,
		add,
		remove,
		clear
	};
}