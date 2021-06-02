import { useAuth } from "./Auth";
import { useState } from "react";

import { Page } from "./Components/Page";
import { UserDetails } from "../User/UserDetails";
import { Button } from "./Components/Button";
import { DoctorEditor } from "../Doctor/Profile/DoctorEditor/DoctorEditor";
import { SecretaryEditor } from "../Doctor/Profile/ClinicEditor/SecretaryEditor";
import { Route } from "react-router";
import { UserProfilePage } from "../User/UserProfilePage";
import { DropdownMenu } from "./Components/DropdownMenu";
import { Link } from "react-router-dom";

export function ProfilePage() {
	const auth = useAuth();
	const [popupManager, setPopupManager] = useState({});

	return (
		<Page title="My Profile" popupManager={popupManager}>
			<DropdownMenu label="Select Profile">
				<Link to="/general/profile/user">User</Link>
				<Link to="/general/profile/doctor">Doctor</Link>
				<Link to="/general/profile/secretary">Secretary</Link>
			</DropdownMenu>
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