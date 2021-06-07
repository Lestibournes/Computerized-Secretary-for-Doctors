import "./HomePage.css";

//Reactjs:
import { Page } from "../Common/Components/Page";
import { DropdownMenu } from "../Common/Components/DropdownMenu";
import { Link, Route } from "react-router-dom";
import { PatientHomeFragment } from "./PatientHomeFragment";
import { DoctorHomeFragment } from "./DoctorHomeFragment";
import { SecretaryProfileFragment } from "../Profile/Secretary/SecretaryProfileFragment";
import { useEffect, useState } from "react";
import { useAuth } from "../Common/Auth";
import { server } from "../Common/server";

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
			server.doctors.getID({user: auth.user.uid}).then(doctor_id => {
				if (doctor_id.data) setDoctor(doctor_id);

				server.secretaries.getID({user: auth.user.uid}).then(secretary_id => {
					console.log(secretary_id, doctor_id);
					if (secretary_id.data) setSecretary(secretary_id);

					if (doctor_id.data) setDefaultView(DOCTOR);
					else if (secretary_id.data) setDefaultView(SECRETARY);
					else setDefaultView(PATIENT);
				});
			});

		}
	}, [auth]);

	useEffect(() => {
		const menuItems = [];

		if (doctor || secretary) {
			menuItems.push(<Link to="/general/home/patient">Patient</Link>);
			if (doctor) menuItems.push(<Link to="/general/home/doctor">Doctor</Link>);
			if (secretary) menuItems.push(<Link to="/general/home/secretary">Secretary</Link>)

			setItems(menuItems);
		}
	}, [doctor, secretary])

	return (
		<>
		<Page>
			<header>
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
		</Page>
		</>
	);
}