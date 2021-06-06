import { Button } from "../Common/Components/Button";

export function DoctorHomeFragment() {
	return (
		<>
			<h2>Doctor</h2>
			<div className="Home buttonGrid">
				<Button link="/specific/doctor/appointments/calendar" label="Work Calendar" />
				<Button link="/specific/doctor/appointments/list" label="Work Agenda" />
			</div>
		</>
	);
}