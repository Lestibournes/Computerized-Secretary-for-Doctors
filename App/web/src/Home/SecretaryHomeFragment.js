import { Button } from "../Common/Components/Button";

export function SecretaryHomeFragment() {
	return (
		<>
			<h2>{Strings.instance.get(30)}</h2>
			<div className="Home buttonGrid">
				<Button link="/secretary/profile" label={Strings.instance.get(38)} />
			</div>
		</>
	);
}