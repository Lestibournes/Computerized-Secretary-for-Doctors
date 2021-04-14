//Reactjs:
import React, { useEffect, useState } from 'react';
import { MainHeader, useAuth } from "../Common/CommonComponents";
import { Redirect, useParams } from 'react-router-dom';
import { db, fn } from '../init';

const getDoctor = fn.httpsCallable("doctors-get");

export function AppointmentDeletedPage() {
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
			<div className="searchbar">
				<h1>Make an Appointment</h1>
				<h2>Success!</h2>
				<p>
					Your appointment has been successfully deleted.
				</p>
			</div>
		</div>
	);
}