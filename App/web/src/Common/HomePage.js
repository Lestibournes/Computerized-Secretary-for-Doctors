//Reactjs:
import { MainHeader, useAuth } from "./CommonComponents";
import { Link, Redirect } from 'react-router-dom';

export function HomePage(props) {
	const auth = useAuth();

	return (
		<div className="page">
			{!auth.user ? <Redirect to="/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="content">

				<div className="appointment_picker">
					<h1>Welcome</h1>
					<div className="buttonBar">
						<Link className="button" to="searchDoctors">Make an Appointment</Link>
						<Link className="button" to="user/appointments">My Future Appointments</Link>
						<Link className="button" to="calendar">Work calendar</Link>
						<Link className="button" to="profile">Doctor Profile</Link>
					</div>
				</div>
			</div>
		</div>
	);
}