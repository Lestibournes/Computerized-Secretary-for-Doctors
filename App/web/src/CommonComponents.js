import React from 'react';
import { useField } from 'formik';
import { Link, NavLink, Redirect } from 'react-router-dom';
import { db, fb } from "./init";

export const TextInput = ({ label, ...props }) => {
	// useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
	// which we can spread on <input> and alse replace ErrorMessage entirely.
	const [field, meta] = useField(props);
	const error = meta.touched && meta.error ? "error" : null;
	if (!props.id) {
		props.id = props.name;
	}
	else if (!props.name) {
		props.name = props.id;
	}
	
	return (
		<>
		<label htmlFor={props.id}>{label}</label>
			<input className={error} {...field} {...props} />
			{meta.touched && meta.error ? (
				<div className="error">{meta.error}</div>
			) : null}
		</>
	);
};

export class MainHeader extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			user: null,
			fname: "",
			lname: ""
		}

		fb.auth().onAuthStateChanged((user) => {
			if (user) {
				db.collection("users").doc(user.uid).get().then((doc) => {
					if (doc.exists) {
						this.setState({
							user: user,
							fname: doc.data().first,
							lname: doc.data().last
						});
					}
				});
			}
		});
	}

	logout() {
		fb.auth().signOut().then(() => {
			console.log("I'm out!");

			if (document.location.href != "/"){
				document.location.href = "/";
			}
		})
		.catch((error) => {
			console.error(error);
		});
	}

	render() {
		return (
			<>
				<div className="mainHeader">
					<div className="title">CSFPD</div>
					<nav>
						<NavLink className="button" activeClassName="okay" exact to="/">Home</NavLink>
						<NavLink className="button" activeClassName="okay" to="/login">Login</NavLink>
						<NavLink className="button" activeClassName="okay" to="/register">Register</NavLink>
					</nav>
					<div>
						{this.state.fname + " " + this.state.lname}
						<Link className="button warning" onClick={this.logout}>Log out</Link>
					</div>
				</div>
				<div className="mainMenu">
			</div>
		</>
		);
	}
}