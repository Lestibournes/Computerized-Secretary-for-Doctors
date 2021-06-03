import "./HomePage.css";

//Reactjs:
import { Button } from "./Components/Button";
import { Page } from "./Components/Page";
import { DropdownMenu } from "./Components/DropdownMenu";
import { Link, Route } from "react-router-dom";
import { UserDetails } from "../User/UserDetails";
import { PatientHomeFragment } from "../Patient/PatientHomeFragment";
import { DoctorHomeFragment } from "../Doctor/DoctorHomeFragment";
import { SecretaryHomeFragment } from "../Secretary/SecretaryHomeFragment";

export function HomePage() {
	return (
		<>
		<Page>
			<header>
				<h1>Welcome</h1>
				<div>
					<DropdownMenu label="View As...">
						<Link to="/general/home/patient">Patient</Link>
						<Link to="/general/home/doctor">Doctor</Link>
						<Link to="/general/home/secretary">Secretary</Link>
					</DropdownMenu>
				</div>
			</header>
			<Route
				component={({ match }) =>
					<>
						<Route path={match.path + "/patient"} component={PatientHomeFragment} />
						<Route path={match.path + "/doctor"} component={DoctorHomeFragment} />
						<Route path={match.path + "/secretary"} component={SecretaryHomeFragment} />
					</>
				}
			/>
		</Page>
		</>
	);
}