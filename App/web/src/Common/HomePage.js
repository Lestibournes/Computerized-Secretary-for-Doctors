import "./HomePage.css";

//Reactjs:
import { Button } from "./Components/Button";
import { Page } from "./Components/Page";

export function HomePage() {
	return (
		<Page title="Welcome">
			<div className="home buttonBar">
				<Button link="/general/searchDoctors" label="Make an Appointment" />
				<Button link="/specific/user/appointments/list" label="My Future Appointments" />
				<Button link="/specific/doctor/appointments/calendar" label="Work Calendar" />
				<Button link="/specific/doctor/profile" label="Doctor Profile" />
				<Button link="/specific/secretary/profile" label="Secretary Profile" />
			</div>
		</Page>
	);
}