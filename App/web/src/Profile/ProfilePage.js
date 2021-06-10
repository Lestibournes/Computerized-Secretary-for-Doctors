import { UserProfileFragment } from "./User/UserProfileFragment";
import { DoctorProfileFragment } from "./Doctor/DoctorProfileFragment";
import { SecretaryProfileFragment } from "./Secretary/SecretaryProfileFragment";
import { Route } from "react-router";
import { DropdownMenu } from "../Common/Components/DropdownMenu";
import { Link } from "react-router-dom";
import { Header } from "../Common/Components/Header";
import { useRoot } from "../Common/Root";

export function ProfilePage() {
	const root = useRoot();

	return (
		<div className="Page">
			<Header />
			<header className="subtitle">
				<h1>Edit Profile</h1>
				<div>
					<DropdownMenu label="Select Profile">
						<Link to={root.get() + "/user/profile/user"}>User</Link>
						<Link to={root.get() + "/user/profile/doctor"}>Doctor</Link>
						<Link to={root.get() + "/user/profile/secretary"}>Secretary</Link>
					</DropdownMenu>
				</div>
			</header>
			<main>
				<Route
					component={({ match }) =>
						<>
							<Route exact path={match.path + "/"} component={UserProfileFragment} />
							<Route path={match.path + "/user"} component={UserProfileFragment} />
							<Route path={match.path + "/doctor"} component={DoctorProfileFragment} />
							<Route path={match.path + "/secretary"} component={SecretaryProfileFragment} />
						</>
					}
				/>
			</main>
		</div>
	);
}