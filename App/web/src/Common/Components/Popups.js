import { usePopups } from "../Popups";

export function Popups() {
	const popupManager = usePopups();

	return (
		<>{popupManager.popups}</>
	);
}