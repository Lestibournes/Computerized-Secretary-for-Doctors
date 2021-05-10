import "./HomePage.css";

//Reactjs:
import { Button } from "./Components/Button";
import { Page } from "./Components/Page";

export function HomePage() {
	return (
		<Page title="Welcome">
				<h2>Patient Services</h2>
				<div className="Home buttonGrid">
					<Button link="/general/searchDoctors" label="Make an Appointment" />
					<Button link="/specific/user/appointments/list" label="Future Appointments" />
				</div>

				<h2>Doctor Services</h2>
				<div className="Home buttonGrid">
					<Button link="/specific/doctor/appointments/calendar" label="Work Calendar" />
					<Button link="/specific/doctor/profile" label="Profile" />
				</div>

				<h2>Secretary Services</h2>
				<div className="Home buttonGrid">
					<Button link="/specific/secretary/profile" label="Profile" />
				</div>
		</Page>
	);
}