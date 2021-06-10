import { Button } from "../Common/Components/Button";

export function PatientHomeFragment() {
	return (
		<>
			<h2>Patient</h2>
			<div className="Home buttonGrid">
				<Button link="/user/doctors/search" label="Make an Appointment" />
				<Button link="/user/appointments/list" label="Future Appointments" />
			</div>
		</>
	);
}