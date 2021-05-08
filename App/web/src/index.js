import './index.css';

//Reactjs:
import React from 'react';
import ReactDOM from 'react-dom';
import { LoginPage } from './Common/LoginPage';
import { RegisterPage } from "./Common/RegisterPage";
import { ProvideAuth } from "./Common/Auth";
import { SearchDoctorsPage } from "./Patient/SearchDoctorsPage"

import {
	BrowserRouter as Router,
	Switch,
	Route,
	Redirect
} from "react-router-dom";
import { HomePage } from './Common/HomePage';
import { AppointmentSuccessPage } from './Patient/AppointmentSuccessPage';
import { AppointmentListPage } from './Patient/AppointmentListPage';
import { AppointmentDeletedPage } from './Patient/AppointmentDeletedPage';
import { AppointmentCalendarPage } from './Doctor/AppointmentCalendarPage';
import { DoctorEditor } from './Doctor/Profile/DoctorEditor/DoctorEditor'
import { ClinicEditor } from './Doctor/Profile/ClinicEditor/ClinicEditor';
import { ScheduleEditor } from './Doctor/Profile/ClinicEditor/ScheduleEditor';
import { SetAppointmentPage } from './Patient/SetAppointmentPage';
import { SecretaryEditor } from './Doctor/Profile/SecretaryEditor/SecretaryEditor';

/**
 * URL Scheme:
 * /doctor/role/section/action/params...
 * 
 * except for MakeAppointment, in all other cases replace /specific and /general with /:doctor.
 */
ReactDOM.render(
	<ProvideAuth>
		<Router>
			<Switch>
				<Redirect exact from="/" to="/general/" />
				<Route exact path="/general/">
					<HomePage />
				</Route>
				<Route exact path="/general/searchDoctors">
					<SearchDoctorsPage />
				</Route>
				<Route path="/general/login">
					<LoginPage />
				</Route>
				<Route path="/general/register">
					<RegisterPage />
				</Route>
				<Route path="/specific/:doctor/user/appointments/create/:clinic">
					<SetAppointmentPage />
				</Route>
				<Route path="/specific/user/appointments/success/:appointment">
					<AppointmentSuccessPage />
				</Route>
				<Route path="/specific/user/appointments/deleted">
					<AppointmentDeletedPage />
				</Route>
				<Route path="/specific/user/appointments/edit/:appointment">
					<SetAppointmentPage />
				</Route>
				<Route path="/specific/user/appointments/list">
					<AppointmentListPage />
				</Route>
				<Route path="/specific/doctor/appointments/calendar">
					<AppointmentCalendarPage />
				</Route>
				<Route path="/specific/doctor/profile">
					<DoctorEditor />
				</Route>
				<Route path="/specific/doctor/clinics/create">
					<ClinicEditor />
				</Route>
				<Route path="/specific/doctor/clinics/edit/:clinic">
					<ClinicEditor />
				</Route>
				<Route path="/specific/doctor/clinics/schedule/edit/:clinic/:doctor">
					<ScheduleEditor />
				</Route>
				<Route path="/specific/secretary/profile">
					<SecretaryEditor />
				</Route>
			</Switch>
		</Router>
	</ProvideAuth>,
	document.getElementById('root')
);