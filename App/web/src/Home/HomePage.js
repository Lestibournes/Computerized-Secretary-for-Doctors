import "./HomePage.css";

//Reactjs:
import { DropdownMenu } from "../Common/Components/DropdownMenu";
import { Link, Route } from "react-router-dom";
import { PatientHomeFragment } from "./PatientHomeFragment";
import { DoctorHomeFragment } from "./DoctorHomeFragment";
import { SecretaryProfileFragment } from "../Profile/Secretary/SecretaryProfileFragment";
import { useEffect, useState } from "react";
import { useAuth } from "../Common/Auth";
import { server } from "../Common/server";
import { Header } from "../Common/Components/Header";
import { db } from "../init";

const PATIENT = "Patient";
const DOCTOR = "Doctor";
const SECRETARY = "Secretary";

export function HomePage() {
	const auth = useAuth();
	const [doctor, setDoctor] = useState();
	const [secretary, setSecretary] = useState();
	const [items, setItems] = useState();
	const [defaultView, setDefaultView] = useState();

	useEffect(() => {
		if (auth.user) {
			return db.collection("users").doc(auth.user.uid).onSnapshot(user_snap => {
				if (user_snap.data().secretary) setSecretary(auth.user.uid);
				if (user_snap.data().doctor) setDoctor(auth.user.uid);
				
				if (user_snap.data().doctor) setDefaultView(DOCTOR);
				else if (user_snap.data().secretary) setDefaultView(SECRETARY);
				else setDefaultView(PATIENT);
			});
		}
	}, [auth]);

	useEffect(() => {
		const menuItems = [];

		if (doctor || secretary) {
			menuItems.push(<Link to="/home/patient">Patient</Link>);
			if (doctor) menuItems.push(<Link to="/home/doctor">Doctor</Link>);
			if (secretary) menuItems.push(<Link to="/home/secretary">Secretary</Link>)

			setItems(menuItems);
		}
	}, [doctor, secretary])

	return (
		<div className="Page">
			<Header />
			<header className="subtitle">
				<h1>Welcome</h1>
				<div>
					{items ?
					<DropdownMenu label="View As...">
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