import { Button } from "../Common/Components/Button";
import { useRoot } from "../Common/Root";

export function PatientHomeFragment() {
	const root = useRoot()
	return (
		<>
			<h2>Patient</h2>
			<div className="Home buttonGrid">
				<Button link={root.get() + "/user/doctors/search"} label="Make an Appointment" />
				<Button link={root.get() + "/user/appointments/list"} label="Future Appointments" />
			</div>
		</>
	);
}