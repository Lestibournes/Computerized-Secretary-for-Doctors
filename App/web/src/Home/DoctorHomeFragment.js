import { Strings } from "../Common/Classes/strings";
import { Button } from "../Common/Components/Button";
import { useRoot } from "../Common/Root";

export function DoctorHomeFragment() {
	const root = useRoot();

	return (
		<>
			<h2>{Strings.instance.get(28)}</h2>
			<div className="Home buttonGrid">
				<Button link="/doctor/appointments/calendar" label={Strings.instance.get(36)} />
				<Button link="/doctor/appointments/list" label={Strings.instance.get(37)} />
				<Button link={root.get() + "/user/profile/doctor"} label={Strings.instance.get(38)} />
			</div>
		</>
	);
}