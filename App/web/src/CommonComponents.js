import React, { useState, useEffect, useContext } from 'react';
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

export function MainHeader(props) {
	const auth = useAuth();

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
					{auth.user ? 
					<>
						{auth.name.first ? auth.name.first + " " : null}
						{auth.name.last ? auth.name.last + " " : null}
						{auth.user ? "<" + auth.user.email + ">" : null}
						<Link className="button warning" to="#" onClick={auth.logout}>Log out</Link>
					</>
					: null}
				</div>
			</div>
		</>
	);
}

export const AuthContext = React.createContext();

export function ProvideAuth({children}) {
	const auth = useProvideAuth();
	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
	return useContext(AuthContext);
}

function useProvideAuth() {
	const [user, setUser] = useState(null);
	const [name, setName] = useState({first: null, last: null});
	
	const login = (email, password) => {
		return fb.auth().signInWithEmailAndPassword(email, password).then((response) => {
			setUser(response.user);
			return response.user;
		});
	};

	const logout = () => {
		return fb.auth().signOut().then(() => {
			setUser(null);
		});
	};

	const register = (firstName, lastName, email, password) => {
		return fb.auth().createUserWithEmailAndPassword(email, password).then((response) => {
			setUser(response.user);

			db.collection("users").doc(response.user.uid).set({
				firstName: firstName,
				lastName: lastName
			});

			return response.user;
		});
	};
	
	const verifyEmail = () => {
		if (user && !user.emailVerified) {
			return user.sendEmailVerification().then(() => {
				return true;
			})
			.catch((erroe) => {
				return false;
			});
		}
		else {
			return false;
		}
	};

	useEffect(() => {
		const unsubscribe = fb.auth().onAuthStateChanged((user) => {
			if (user) {
				setUser(user);

				db.collection("users").doc(user.uid).onSnapshot((doc) => {
					if (doc.data()) {
						setName({
							first: doc.data().firstName,
							last: doc.data().lastName
						})
					}
					else {
						setName({
							first: null,
							last: null
						})
					}
				});
			}
			else {
				setUser(null);
			}
		});
		
		return () => unsubscribe();
	}, []);

	return {
		user,
		name,
		login,
		logout,
		register,
		verifyEmail
	};
}