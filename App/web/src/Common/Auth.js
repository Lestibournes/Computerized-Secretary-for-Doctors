import React, { useState, useEffect, useContext } from 'react';
import { useField } from 'formik';
import { db, fb } from "../init";

// User authentication services:

export const AuthContext = React.createContext();

// Put this component at the root of any component tree in which you want to access user authenticaiton:
export function ProvideAuth({children}) {
	const auth = useProvideAuth();
	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

// Include this inside components that want to access user authentication services:
export const useAuth = () => {
	return useContext(AuthContext);
}

// The actual authentication services:
function useProvideAuth() {
	const [user, setUser] = useState(null);
	const [name, setName] = useState({first: null, last: null});
	
	/**
	 * Log the user in with email and password.
	 * @param {string} email 
	 * @param {string} password 
	 */
	const login = (email, password) => {
		return fb.auth().signInWithEmailAndPassword(email, password).then((response) => {
			setUser(response.user);
			return response.user;
		});
	};

	/**
	 * Log the user out.
	 */
	const logout = () => {
		return fb.auth().signOut().then(() => {
			setUser(null);
		});
	};

	/**
	 * Register a new user.
	 * @param {string} firstName 
	 * @param {string} lastName 
	 * @param {string} email Must be unique (no other user with the same exact email)
	 * @param {string} password 
	 */
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

	/**
	 * Send a verification email to the user's email address to ensure that user indeed receives emails at the specified address.
	 */
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

	const isLoggedIn = async function(listener) {
		await fb.auth().onAuthStateChanged((user) => {
			if (user) {
				listener(true);
			}
			else {
				listener(false);
			}
		});
	};

	// Listen to changes in user login status and update the user and name states accordingly:
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
		verifyEmail,
		isLoggedIn
	};
}