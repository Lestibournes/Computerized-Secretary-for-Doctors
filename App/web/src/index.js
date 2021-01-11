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

ReactDOM.render(
	<ProvideAuth>
		<Router>
			<Switch>
				<Route exact path="/">
					<SearchDoctorsPage />
				</Route>
				<Route path="/login">
					<LoginPage />
				</Route>
				<Route path="/register">
					<RegisterPage />
				</Route>
				<Route path="/create/:id">
					<MakeAppointmentPage />
				</Route>
			</Switch>
		</Router>
	</ProvideAuth>,
	document.getElementById('root')
);