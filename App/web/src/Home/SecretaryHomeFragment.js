import { Button } from "../Common/Components/Button";

export function SecretaryHomeFragment() {
	return (
		<>
			<h2>Secretary</h2>
			<div className="Home buttonGrid">
				<Button link="/secretary/profile" label="Profile" />
			</div>
		</>
	);
}