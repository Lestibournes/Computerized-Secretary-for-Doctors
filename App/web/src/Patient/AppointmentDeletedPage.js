//Reactjs:
import React from 'react';
import { Page } from '../Common/Components/Page';

export function AppointmentDeletedPage() {
	return (
		<Page
			title="Make an Appointment"
			subtitle="Success!"
			content={<p>Your appointment has been successfully deleted.</p>}
		/>
	);
}