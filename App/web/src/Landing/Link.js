import { useEffect, useState } from "react";
import { useParams } from "react-router"
import { Header } from "../Common/Components/Header";
import { server } from "../Common/server";
import { ClinicLandingFragment } from "./ClinicLandingFragment";
import { DoctorLandingFragment } from "./DoctorLandingFragment";

const CLINIC = "clinic";
const DOCTOR = "doctor";

export function Link() {
	const {link} = useParams();
	const [target, setTarget] = useState();

	useEffect(() => {
		if (link) {
			server.links.getTarget({name: link}).then(response => {
				if (response.data.success) setTarget(response.data.target);
			});
		}
	}, [link]);

	return (
		<div className="Page">
			<Header link={link} />
			{target?.type === CLINIC ?
				<ClinicLandingFragment clinic={target.id} />
			: ""}
			{target?.type === DOCTOR ?
				<DoctorLandingFragment doctor={target.id} />
			: ""}
		</div>
	)
}