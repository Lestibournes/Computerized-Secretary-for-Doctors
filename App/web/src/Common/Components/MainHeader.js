import { Link } from "react-router-dom";
import { useAuth } from "../CommonComponents";
import { Button } from "./Button";
import "./MainHeader.css";

/**
 * The header component for the site, which holds the logo, main navigation, and user menu that includes the logout option.
 */
 export function MainHeader(props) {
	const auth = useAuth();

	return (
		<div className="mainHeader">
			<Link to="/general/" className="title">CSFPD</Link>
			{/* <nav>
				<NavLink className="button" activeClassName="okay" exact to="/general/">Home</NavLink>
				<NavLink className="button" activeClassName="okay" to="/general/login">Login</NavLink>
				<NavLink className="button" activeClassName="okay" to="/general/register">Register</NavLink>
			</nav> */}
			<div>
				{auth.user ? 
				<>
					{auth.name.first ? auth.name.first + " " : null}
					{auth.name.last ? auth.name.last + " " : null}
					{auth.user ? "<" + auth.user.email + ">" : null}
					<Button type="cancel" action={auth.logout} label="Log out" />
					{/* <Link className="button warning" to="#" onClick={auth.logout}>Log out</Link> */}
				</>
				: null}
			</div>
		</div>
	);
}