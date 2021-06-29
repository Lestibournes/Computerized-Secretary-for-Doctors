import { Strings } from "../Common/Classes/strings";
import { Button } from "../Common/Components/Button";
import { useRoot } from "../Common/Root";

export function PatientHomeFragment() {
	const root = useRoot()
	return (
		<>
			<h2>{Strings.instance.get(26)}</h2>
			<div className="Home buttonGrid">
				<Button link={root.get() + "/user/doctors/search"} label={Strings.instance.get(49)} />
				<Button link={root.get() + "/user/appointments/list"} label={Strings.instance.get(50)} />
			</div>
		</>
	);
}