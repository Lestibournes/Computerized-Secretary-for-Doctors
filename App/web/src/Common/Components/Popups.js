import { usePopups } from "../Popups";

export function Popups() {
	const popups = usePopups();

	return (
		<>{popups.popups}</>
	);
}