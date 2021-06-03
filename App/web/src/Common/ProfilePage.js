import { useAuth } from "./Auth";
import { useState } from "react";

import { Page } from "./Components/Page";
import { UserDetails } from "../User/UserDetails";
import { DoctorEditor } from "../Doctor/Profile/DoctorEditor/DoctorEditor";
import { SecretaryProfilePage } from "../Secretary/SecretaryProfilePage";
import { Route } from "react-router";
import { DropdownMenu } from "./Components/DropdownMenu";
import { Link } from "react-router-dom";

export function ProfilePage() {
	const auth = useAuth();

	return (
		<Page>
			<header>
				<h1>Edit Profile</h1>
				<div>
					<DropdownMenu label="Select Profile">
						<Link to="/general/profile/user">User</Link>
						<Link to="/general/profile/doctor">Doctor</Link>
						<Link to="/general/profile/secretary">Secretary</Link>
					</DropdownMenu>
				</div>
			</header>
			<Route
				component={({ match }) =>
					<>
						<Route path={match.path + "/user"} component={UserDetails} />
						<Route path={match.path + "/doctor"} component={DoctorEditor} />
						<Route path={match.path + "/secretary"} component={SecretaryProfilePage} />
					</>
				}
			/>
		</Page>
	);
}