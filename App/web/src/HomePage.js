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
					<Link className="button" to="searchDoctors">Make an Appointment</Link>
				</div>
			</div>
		</div>
	);
}