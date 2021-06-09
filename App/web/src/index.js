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
import { HomePage } from './Home/HomePage';
import { AppointmentSuccessPage } from './Patient/AppointmentSuccessPage';
import { AppointmentListPage } from './Patient/AppointmentListPage';
import { AppointmentDeletedPage } from './Patient/AppointmentDeletedPage';
import { AppointmentCalendarPage } from './Calendar/AppointmentCalendarPage';
import { DoctorProfileFragment } from './Profile/Doctor/DoctorProfileFragment'
import { ClinicEditor } from './Clinic/Editor/ClinicEditor';
import { ScheduleEditor } from './Clinic/Editor/Schedules/ScheduleEditor';
import { SetAppointmentPage } from './Patient/SetAppointmentPage';
import { ClinicPage } from './Clinic/ClinicPage';
import { AppointmentPage } from './Doctor/AppointmentPage';
import { SecretaryEditor } from "./Clinic/Editor/SecretaryEditor";
import { ClinicAgendaPage } from './Clinic/ClinicAgendaPage';
import { ClinicSchedulesPage } from './Clinic/ClinicSchedulesPage';
import { ProfilePage } from './Profile/ProfilePage';
import { DoctorAgendaPage } from './Doctor/DoctorAgendaPage';
import { ProvidePopups } from './Common/Popups';
import { Link } from './Landing/Link';
import { Notifier } from './Common/Components/Notifier';
import { Popups } from './Common/Components/Popups';

/**
 * URL Scheme:
 * /doctor/role/section/action/params...
 * 
 * except for MakeAppointment, in all other cases replace /specific and /general with /:doctor.
 */
ReactDOM.render(
	<ProvideAuth>
		<ProvidePopups>
			<Notifier />
			<Router>
				<Switch>

					{/* General */}

					<Redirect exact from="/" to="/general/home" />
					<Redirect exact from="/general" to="/general/home" />
					<Route path="/general/home">
						<HomePage />
					</Route>
					<Route path="/general/login">
						<LoginPage />
					</Route>
					<Route path="/general/register">
						<RegisterPage />
					</Route>
					<Route path="/general/profile">
						<ProfilePage />
					</Route>

					{/* Patients */}

					<Route exact path="/general/doctors/search">
						<SearchDoctorsPage />
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

					{/* Doctors */}

					<Route path="/specific/doctor/appointments/calendar">
						<AppointmentCalendarPage />
					</Route>
					<Route path="/specific/doctor/appointments/list">
						<DoctorAgendaPage />
					</Route>
					<Route path="/specific/doctor/profile">
						<DoctorProfileFragment />
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
					<Route path="/specific/doctor/appointments/details/:appointment">
						<AppointmentPage />
					</Route>

					{/* Clinics */}
					<Route path="/specific/doctor/clinics/view/:clinic">
						<ClinicPage />
					</Route>
					<Route path="/specific/clinics/appointments/agenda/:clinic">
						<ClinicAgendaPage />
					</Route>
					<Route path="/specific/clinic/appointments/calendar/:clinic">
						<AppointmentCalendarPage />
					</Route>
					<Route path="/specific/secretary/appointments/view/:appointment">
						<AppointmentPage />
					</Route>
					<Route path="/specific/clinics/schedules/:clinic">
						<ClinicSchedulesPage />
					</Route>


					{/* Secretaries */}

					<Route path="/specific/secretary/clinics/view/:clinic">
						<ClinicPage />
					</Route>
					<Route path="/specific/secretary/appointments/view/:appointment">
						<AppointmentPage />
					</Route>
					<Route path="/specific/secretary/appointments/edit/:appointment">
						<SetAppointmentPage />
					</Route>
					<Route path="/specific/doctor/clinics/secretary/edit/:clinic/:secretary">
						<SecretaryEditor />
					</Route>

					{/* Links */}
					<Route exact path="/:link">
						<Link />
					</Route>
					<Route path="/:link/:clinic/:doctor">
						<SetAppointmentPage />
					</Route>
				</Switch>
			</Router>

			<Popups />
		</ProvidePopups>
	</ProvideAuth>,
	document.getElementById('root')
);