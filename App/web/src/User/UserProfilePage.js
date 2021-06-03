import { useAuth } from "../Common/Auth";
import { useState } from "react";

import { Page, usePopups } from "../Common/Components/Page";
import { UserDetails } from "../User/UserDetails";

export function UserProfilePage() {
	const auth = useAuth();
	const popupManager = usePopups();

	return (
		<Page title="My Profile">
			{/* <div className="Home buttonGrid">
				<Button link="/general/users/profile" label="User" />
				<Button link="/specific/doctor/profile" label="Doctor" />
				<Button link="/specific/secretary/profile" label="Secretary" />
			</div> */}
			<UserDetails user={auth?.user?.uid} popupManager={popupManager} />
		</Page>
	);
}