import { useEffect, useState } from "react";
import { useParams } from "react-router"
import { Header } from "../Common/Components/Header";
import { Loading } from "../Common/Components/Loading";
import { usePopups } from "../Common/Popups";
import { useRoot } from "../Common/Root";
import { server } from "../Common/server";
import { db } from "../init";
import { ClinicLandingFragment } from "./ClinicLandingFragment";
import { DoctorLandingFragment } from "./DoctorLandingFragment";

const CLINIC = "clinic";
const DOCTOR = "doctor";

export function Link() {
	const root = useRoot();
	const popups = usePopups();

	const {link} = useParams();
	const [target, setTarget] = useState();

	useEffect(() => {
		if (link) {
			db.collection("links").doc(link).get().then(
				link_snap => {
					if (link_snap.exists) {
						const link_data = link_snap.data();
						link_data.id = link_data.id;
						setTarget(link_data);
						root.set(link);
					}
					else popups.error("Page doesn't exist");
				}
			)
			.catch(reason => popups.error(reason.message));
		}
	}, [link]);

	return (
		<div className="Page">
			<Header />
			{target?.type === CLINIC ?
				<ClinicLandingFragment clinic={target.id} />
			: ""}
			{target?.type === DOCTOR ?
				<DoctorLandingFragment doctor={target.id} />
			: ""}
		</div>
	)
}