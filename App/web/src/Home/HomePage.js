import "./HomePage.css";

//Reactjs:
import { DropdownMenu } from "../Common/Components/DropdownMenu";
import { Link, Route } from "react-router-dom";
import { PatientHomeFragment } from "./PatientHomeFragment";
import { DoctorHomeFragment } from "./DoctorHomeFragment";
import { SecretaryProfileFragment } from "../Profile/Secretary/SecretaryProfileFragment";
import { useEffect, useState } from "react";
import { useAuth } from "../Common/Auth";
import { Header } from "../Common/Components/Header";
import { db } from "../init";
import { usePopups } from "../Common/Popups";
import { Strings } from "../Common/Classes/strings";

const PATIENT = "Patient";
const DOCTOR = "Doctor";
const SECRETARY = "Secretary";

export function HomePage() {
	const auth = useAuth();
	const popups = usePopups();

	const [items, setItems] = useState();
	const [defaultView, setDefaultView] = useState();

	useEffect(() => {
		if (auth?.user?.uid) {
			return db.collection("users").doc(auth.user.uid).onSnapshot(
				user_snap => {
					// Build the "view as" menu:
					const menuItems = [];

					if (user_snap.data().doctor || user_snap.data().secretary) {
						menuItems.push(<Link to="/home/patient">{Strings.instance.get(26)}</Link>);

						if (user_snap.data().doctor) menuItems.push(<Link to="/home/doctor">{Strings.instance.get(28)}</Link>);
						if (user_snap.data().secretary) menuItems.push(<Link to="/home/secretary">{Strings.instance.get(30)}</Link>)

						setItems(menuItems);
					}

					// Set the default view:
					if (user_snap.data().doctor) setDefaultView(DOCTOR);
					else if (user_snap.data().secretary) setDefaultView(SECRETARY);
					else setDefaultView(PATIENT);
				},
				error => popups.error(error.message)
			);
		}
	}, [auth.user]);

	return (
		<div className="Page">
			<Header />
			<header className="subtitle">
				<h1>{Strings.instance.get(32)}</h1>
				<div>
					{items ?
					<DropdownMenu label={Strings.instance.get(34)}>
						{items}
					</DropdownMenu>
					: ""}
				</div>
			</header>
			{defaultView ?
				<Route
					component={({ match }) =>
						<>
							<Route exact path={match.path + "/"} component={defaultView === DOCTOR ? DoctorHomeFragment : defaultView === SECRETARY ? SecretaryProfileFragment : PatientHomeFragment} />
							<Route path={match.path + "/patient"} component={PatientHomeFragment} />
							<Route path={match.path + "/doctor"} component={DoctorHomeFragment} />
							<Route path={match.path + "/secretary"} component={SecretaryProfileFragment} />
						</>
					}
				/>
			: ""}
		</div>
	);
}