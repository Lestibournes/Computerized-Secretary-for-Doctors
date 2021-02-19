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
			</Switch>
		</Router>
	</ProvideAuth>,
	document.getElementById('root')
);