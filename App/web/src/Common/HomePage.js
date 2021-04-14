//Reactjs:
import { MainHeader, useAuth } from "./CommonComponents";
import { Link, Redirect } from 'react-router-dom';
import { useEffect, useState } from "react";

export function HomePage(props) {
	const auth = useAuth();
	const [redirect, setRedirect] = useState(false);

	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!status) setRedirect(true);
		});

		return unsubscribe;
	}, [auth]);

	return (
		<div className="page">
			{redirect ? <Redirect to="/general/login" /> : null }
			<MainHeader section="Home"></MainHeader>
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
	);
}