import "./Page.css";
import React, { useEffect } from "react";
import { useAuth } from "../Auth";
import { usePopups } from "../Popups";
import { Header } from "./Header";
import { Loading } from "./Loading";

export function Page({unprotected, title, subtitle, home, children}) {
	const auth = useAuth();
	const popupManager = usePopups();

	useEffect(() => {
		popupManager.clear();
	}, []);

	return (
		<>
			<div className="Page">
				<Header link={home} unprotected={unprotected} />
				{title ? <h1>{title}</h1> : ""}
				{subtitle ? <h2>{subtitle}</h2> : ""}
				{children ? (auth ? children : <Loading />) : ""}
			</div>
		</>
	);
}