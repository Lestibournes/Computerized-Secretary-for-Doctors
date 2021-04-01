//Reactjs:
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { LoginPage } from './Common/LoginPage';
import { RegisterPage } from "./Common/RegisterPage";
import { ProvideAuth } from "./Common/CommonComponents";
import { SearchDoctorsPage } from "./Patient/SearchDoctorsPage"
import { MakeAppointmentPage } from "./Patient/MakeAppointmentPage"

import {
	BrowserRouter as Router,
	Switch,
	Route
} from "react-router-dom";
import { HomePage } from './Common/HomePage';
import { AppointmentSuccessPage } from './Patient/AppointmentSuccessPage';
import { AppointmentListPage } from './Patient/AppointmentListPage';
import { EditAppointmentPage } from './Patient/EditAppointmentPage';
import { AppointmentDeletedPage } from './Patient/AppointmentDeletedPage';
import { AppointmentCalendarPage } from './Doctor/AppointmentCalendarPage';
import { DoctorEditor } from './Doctor/Profile/DoctorEditor'
import { ClinicEditor } from './Doctor/Profile/ClinicEditor';

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
				<Route path="/deleted">
					<AppointmentDeletedPage />
				</Route>
				<Route path="/edit/:appointment">
					<EditAppointmentPage />
				</Route>
				<Route path="/user/appointments">
					<AppointmentListPage />
				</Route>
				<Route path="/calendar">
					<AppointmentCalendarPage />
				</Route>
				<Route path="/profile">
					<DoctorEditor />
				</Route>
				<Route path="/clinic/create">
					<ClinicEditor />
				</Route>
			</Switch>
		</Router>
	</ProvideAuth>,
	document.getElementById('root')
);