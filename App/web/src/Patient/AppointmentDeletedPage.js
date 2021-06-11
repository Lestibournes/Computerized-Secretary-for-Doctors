//Reactjs:
import React from 'react';
import { Header } from '../Common/Components/Header';

export function AppointmentDeletedPage() {
	return (
		<div className="Page">
			<Header />
			<h1>Make an Appointment</h1>
			<h2>Success!</h2>
			<main>
				<p>Your appointment has been successfully deleted.</p>
			</main>
		</div>
	);
}