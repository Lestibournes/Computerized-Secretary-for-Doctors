import { useAuth } from "../Common/Auth";
import { useState } from "react";

import { Page } from "../Common/Components/Page";
import { UserProfileFragment } from "./User/UserProfileFragment";
import { DoctorProfileFragment } from "./Doctor/DoctorProfileFragment";
import { SecretaryProfileFragment } from "./Secretary/SecretaryProfileFragment";
import { Route } from "react-router";
import { DropdownMenu } from "../Common/Components/DropdownMenu";
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
						<Route path={match.path + "/user"} component={UserProfileFragment} />
						<Route path={match.path + "/doctor"} component={DoctorProfileFragment} />
						<Route path={match.path + "/secretary"} component={SecretaryProfileFragment} />
					</>
				}
			/>
		</Page>
	);
}