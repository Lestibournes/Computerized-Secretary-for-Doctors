import React, { useState, useEffect, useContext } from 'react';
import { auth, db, fb } from "../init";

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

	// Listen to changes in user login status and update the user and name states accordingly:
	useEffect(() => {
		const unsubscribe = fb.auth().onAuthStateChanged((user) => {
			if (user) setUser(user);
			else setUser(null);
		});
		
		return () => unsubscribe();
	}, []);

	return {
		user,
		login,
		logout,
		register,
		verifyEmail,
		isLoggedIn
	};
}

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
export const login = (email, password) => {
	const result = {
		success: false,
		message: "",
		user: null,
	}
	
	return fb.auth().signInWithEmailAndPassword(email, password)
	.then(response => {
		result.success = true;
		result.user = response.user;
		
		return result;
	})
	.catch(error => {
		console.log("boo");
		result.message = error.message;
		return result;
	})
};

/**
 * Log the user out.
 */
 export const logout = () => {
	return fb.auth().signOut();
};

/**
 * Register a new user.
 * @param {string} firstName 
 * @param {string} lastName 
 * @param {string} email Must be unique (no other user with the same exact email)
 * @param {string} sex
 * @param {string} password 
 * @returns {Promise<{
 * 	success: boolean,
 * 	message: string,
 * 	user: firebase.default.User
 * }>}
 */
 export const register = async (firstName, lastName, sex, email, password) => {
	const result = {
		success: false,
		message: "",
		user: null,
	}

	await fb.auth().signOut();

	await fb.auth().createUserWithEmailAndPassword(email, password)
	.then(create_response => result.user = create_response.user)
	.catch(reason => result.message = reason.message);
	
	if (result.user) {
		await db.collection("users").doc(result.user.uid).set({
			firstName: firstName,
			lastName: lastName,
			fullName: firstName + " " + lastName,
			sex: sex.toLowerCase()
		})
		.then(() => result.success = true)
		.catch(reason => result.message = reason.message);
	}

	return result;
};

/**
 * Send a verification email to the user's email address to ensure that user indeed receives emails at the specified address.
 */
export const verifyEmail = () => {
	if (!auth?.currentUser?.emailVerified) {
		return auth.currentUser.sendEmailVerification().then(() => {
			return true;
		})
		.catch((error) => {
			return false;
		});
	}
	else {
		return false;
	}
};

export const isLoggedIn = async function(listener) {
	await fb.auth().onAuthStateChanged((user) => {
		if (user) listener(true);
		else listener(false);
	});
};