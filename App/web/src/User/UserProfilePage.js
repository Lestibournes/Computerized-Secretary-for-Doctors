import { useAuth } from "../Common/Auth";
import { useState } from "react";

import { Page } from "../Common/Components/Page";
import { UserDetails } from "../User/UserDetails";

export function UserProfilePage() {
	const auth = useAuth();
	const [popupManager, setPopupManager] = useState({});

	return (
		<Page title="User Profile" popupManager={popupManager}>
			<UserDetails user={auth?.user?.uid} popupManager={popupManager} />
		</Page>
	);
}