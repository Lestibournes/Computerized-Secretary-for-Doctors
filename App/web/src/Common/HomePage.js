//Reactjs:
import { MainHeader, useAuth } from "./CommonComponents";
import { Link, Redirect } from 'react-router-dom';

export function HomePage(props) {
	const auth = useAuth();

	return (
		<div className="page">
			{!auth.user ? <Redirect to="/general/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="content">

				<div className="appointment_picker">
					<h1>Welcome</h1>
					<div className="buttonBar">
						<Link className="button" to="/general/searchDoctors">Make an Appointment</Link>
						<Link className="button" to="/specific/user/appointments/list">My Future Appointments</Link>
						<Link className="button" to="/specific/doctor/appointments/calendar">Work calendar</Link>
						<Link className="button" to="/specific/doctor/profile">Doctor Profile</Link>
					</div>
				</div>
			</div>
		</div>
	);
}