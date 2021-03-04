//Reactjs:
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { LoginPage } from './LoginPage';
import { RegisterPage } from "./RegisterPage";
import { ProvideAuth } from "./CommonComponents";
import { SearchDoctorsPage } from "./SearchDoctorsPage"
import { MakeAppointmentPage } from "./MakeAppointmentPage"

import {
	BrowserRouter as Router,
	Switch,
	Route
} from "react-router-dom";
import { HomePage } from './HomePage';
import { AppointmentSuccessPage } from './AppointmentSuccessPage';
import { AppointmentListPage } from './AppointmentListPage';
import { EditAppointmentPage } from './EditAppointmentPage';

ReactDOM.render(
	<ProvideAuth>
		<Router>
			<Switch>
				<Route exact path="/">
					<HomePage />
				</Route>
				<Route exact path="/searchDoctors">
					<SearchDoctorsPage />
				</Route>
				<Route path="/login">
					<LoginPage />
				</Route>
				<Route path="/register">
					<RegisterPage />
				</Route>
				<Route path="/create/:doctor/:clinic">
					<MakeAppointmentPage />
				</Route>
				<Route path="/create/:appointment">
					<AppointmentSuccessPage />
				</Route>
				<Route path="/edit/:appointment">
					<EditAppointmentPage />
				</Route>
				<Route path="/user/appointments">
					<AppointmentListPage />
				</Route>
			</Switch>
		</Router>
	</ProvideAuth>,
	document.getElementById('root')
);