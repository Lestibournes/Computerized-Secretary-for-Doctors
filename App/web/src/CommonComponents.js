import React, { useState, useEffect, useContext } from 'react';
import { Formik, useField } from 'formik';
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
		<label htmlFor={props.id}>{label}:</label>
			<input className={error} {...field} {...props} />
			{meta.touched && meta.error ? (
				<div className="error">{meta.error}</div>
			) : null}
		</>
	);
};

export const Select = ({ label, ...props }) => {
	const [field, meta] = useField(props);
	return (
		<>
			<label htmlFor={props.id || props.name}>{label}:</label>
			<select {...field} {...props}>
				<option disabled selected value> Select an Option </option>
				{
					props.options.map(option => {
						return <option key={option.id} value={option.id}>{option.label}</option>
					})
				}
			</select>
			{meta.touched && meta.error ? (
				<div className="error">{meta.error}</div>
			) : null}
		</>
	);
};

export const SelectList = ({ label, options, selected, ...props}) => {
	const [field, meta] = useField(props);
	const error = meta.touched && meta.error ? "error" : null;
	
	field.value = options[selected];

	if (!props.id) {
		props.id = props.name;
	}
	else if (!props.name) {
		props.name = props.id;
	}
	
	return (
		<div className="picker list">
			<div className="header">
				<div className="label"><label htmlFor={props.id}>{label}:</label></div>
				<input type="hidden" className={error} {...field} {...props} />
			</div>
			<div className="body">
				<div className="list">
					{options.map((option, index) => {
						return <div
							key={option}
							className={"selectitem " + (selected == index ? "selected" : "")}
							onClick={() => props.onClick(index)}>
								{option}
							</div>
					})}
				</div>
			</div>
				{/* {meta.touched && meta.error ? (
					<div className="error">{String(meta.error)}</div>
				) : null} */}
		</div>
	);
};

export const SelectDate = ({ day, month, year, ...props}) => {
	const [field, meta] = useField(props);
	const error = meta.touched && meta.error ? "error" : null;
	const month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	const day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	const getNextMonth = (month, year) => {
		if (month == 11) {
			return {
				month: 0,
				year: year + 1
			}
		}
		else {
			return {
				month: month + 1,
				year: year
			}
		}
	}

	const getPreviousMonth = (month, year) => {
		if (month == 0) {
			return {
				month: 11,
				year: year - 1
			}
		}
		else {
			return {
				month: month - 1,
				year: year
			}
		}
	}

	if (month < 0) {
		month += 12;
		year--;
	}
	else if (month > 11) {
		month %= 11;
		year++;
	}

	field.value = new Date(year, month, day);

	if (!props.id) {
		props.id = props.name;
	}
	else if (!props.name) {
		props.name = props.id;
	}
	
	const startday = new Date(year, month, 1).getDay();
	const current_length = (new Date(year, month + 1, 0)).getDate();
	
	const previous_month = getPreviousMonth(month, year);
	const previous_length = (new Date(previous_month.year, previous_month.month, 0)).getDate();

	const next_month = getNextMonth(month, year);
	
	const days = [];

	for (let i = 1; i <= 42; i++) {
		let date;
		let className;

		if (i <= startday) {
			date = {
				day: i + previous_length - startday,
				month: previous_month.month,
				year: previous_month.year
			};
			className = "faded";
		}
		else if (i > current_length) {
			date = {
				day: i - current_length,
				month: next_month.month,
				year: next_month.year
			};

			className = "faded";
		}
		else {
			date = {
				day: i - startday,
				month: month,
				year: year
			};
			
			className = (day == date.day ? "selected" : "")
		}

		days.push(<div
			key={date}
			className={"day " + className}
			onClick={() => props.onClick(date)}>
				{date.day}
			</div>)
	}

	return (
		<div className="picker date">
			<div className="header">
				<button onClick={
					() => {
						let date = getPreviousMonth(month, year);
						// date.day = null;
						props.onClick(date);
					}
					}>{"<"}</button>
				<div className="label">{month_names[month] + " " + year}</div>
				<input type="hidden" className={error} {...field} {...props} />
				<button onClick={
					() => {
						let date = getNextMonth(month, year);
						// date.day = null;
						props.onClick(date);
					}
					}>{">"}</button>
			</div>
			<div className="body">
				{
					days
				}
			</div>
				{/* {meta.touched && meta.error ? (
					<div className="error">{String(meta.error)}</div>
				) : null} */}
		</div>
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