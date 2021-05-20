import React, { useState, useEffect, useContext } from 'react';
import { fb } from "../init";
import {server} from "./server";

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
	const [name, setName] = useState({first: null, last: null, full: null});
	
	/**
	 * Log the user in with email and password.
	 * @param {string} email
	 * @param {string} password
	 * @returns {Promise<{
	 * 	success: boolean,
	 * 	message: string,
	 * 	user: firebase.default.User
	 * }>}
	 */
	const login = (email, password) => {
		const result = {
			success: false,
			message: "",
			user: null,
		}
		
		return fb.auth().signInWithEmailAndPassword(email, password).then(response => {
			result.success = true;
			result.user = response.user;
			
			setUser(response.user);
			return response;
		}).catch(error => {
			result.message = error.message;
			return result;
		})
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
	 * @returns {Promise<{
	 * 	success: boolean,
	 * 	message: string,
	 * 	user: firebase.default.User
	 * }>}
	 */
	const register = async (firstName, lastName, email, password) => {
		const result = {
			success: false,
			message: "",
			user: null,
		}

		return fb.auth().createUserWithEmailAndPassword(email, password).then(create_response => {
			result.user = create_response.user;
			setUser(result.user);
			
			return server.users.add({user: result.user.uid, firstName: firstName, lastName: lastName}).then(add_response => {
				if (add_response.data.success) {
					result.success = true;
					return result;
				}
				else {
					result.message = add_response.data.message;
				}
			}).catch(reason => {
				result.message = "Could not create user profile";
				return result;
			});
		}).catch(reason => {
			result.message = "Could not register user";
			return result;
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

				server.users.get({user: user.uid}).then(response => {
					console.log(response.data);
					setName({
						first: response.data.firstName,
						last: response.data.lastName,
						full: response.data.firstName + " " + response.data.lastName})
				})
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