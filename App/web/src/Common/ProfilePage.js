import { useAuth } from "./Auth";
import { useState } from "react";

import { Page } from "./Components/Page";
import { UserDetails } from "../User/UserDetails";
import { Button } from "./Components/Button";
import { DoctorEditor } from "../Doctor/Profile/DoctorEditor/DoctorEditor";
import { SecretaryEditor } from "../Doctor/Profile/ClinicEditor/SecretaryEditor";
import { Route } from "react-router";
import { UserProfilePage } from "../User/UserProfilePage";

export function ProfilePage() {
	const auth = useAuth();
	const [popupManager, setPopupManager] = useState({});

	return (
		<Page title="My Profile" popupManager={popupManager}>
			<div className="Home buttonGrid">
				<Button link="/general/profile/user" label="User" />
				<Button link="/general/profile/doctor" label="Doctor" />
				<Button link="/general/profile/secretary" label="Secretary" />
			</div>
			<Route
				component={({ match }) =>
					<div>
						<Route path={match.path + "/user"} component={UserDetails} />
						<Route path={match.path + "/doctor"} component={DoctorEditor} />
						<Route path={match.path + "/secretary"} component={SecretaryEditor} />
					</div>
				}
			/>
		</Page>
	);
}