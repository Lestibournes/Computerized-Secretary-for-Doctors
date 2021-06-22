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
import { DoctorCalendarPage } from "./Calendar/DoctorCalendarPage";
import { ClinicCalendarPage } from "./Calendar/ClinicCalendarPage";
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
import { AppointmentDetailsPage } from './Patient/AppointmentDetailsPage';
import { ProvidePopups } from './Common/Popups';
import { Link } from './Landing/Link';
import { Notifier } from './Common/Components/Notifier';
import { Popups } from './Common/Components/Popups';
import { ProvideRoot } from './Common/Root';

/**
 * URL Scheme:
 * /doctor/role/section/action/params...
 * 
 * except for MakeAppointment, in all other cases replace /specific and /general with /:doctor.
 */
ReactDOM.render(
	<Router>
		<ProvideAuth>
			<ProvideRoot>
				<ProvidePopups>
					<Notifier />
						<Switch>

							{/* General */}

							<Redirect exact from="/" to="/home" />
							<Route path="/home">
								<HomePage />
							</Route>
							<Route path="/user/login">
								<LoginPage />
							</Route>
							<Route path="/user/register">
								<RegisterPage />
							</Route>
							<Route path="/user/profile">
								<ProfilePage />
							</Route>

							{/* Patients */}

							<Route exact path="/user/doctors/search">
								<SearchDoctorsPage />
							</Route>
							<Route path="/user/appointments/create/:clinic/:doctor">
								<SetAppointmentPage />
							</Route>
							<Route path="/user/appointments/success/:appointment">
								<AppointmentSuccessPage />
							</Route>
							<Route path="/user/appointments/deleted">
								<AppointmentDeletedPage />
							</Route>
							<Route path="/user/appointments/details/:appointment">
								<AppointmentDetailsPage />
							</Route>
							<Route path="/user/appointments/edit/:appointment">
								<SetAppointmentPage />
							</Route>
							<Route path="/user/appointments/list">
								<AppointmentListPage />
							</Route>

							{/* Doctors */}

							<Route path="/doctor/appointments/calendar">
								<DoctorCalendarPage />
							</Route>
							<Route path="/doctor/appointments/list">
								<DoctorAgendaPage />
							</Route>
							<Route path="/doctor/clinics/create">
								<ClinicEditor />
							</Route>
							<Route path="/clinics/schedule/edit/:clinic/:doctor">
								<ScheduleEditor />
							</Route>
							<Route path="/doctor/appointments/details/:appointment">
								<AppointmentPage />
							</Route>

							{/* Clinics */}
							<Route path="/clinics/view/:clinic">
								<ClinicPage />
							</Route>
							<Route path="/clinics/edit/:clinic">
								<ClinicEditor />
							</Route>
							<Route path="/clinics/appointments/agenda/:clinic">
								<ClinicAgendaPage />
							</Route>
							<Route path="/clinic/appointments/calendar/:clinic">
								<ClinicCalendarPage />
							</Route>
							<Route path="/clinic/appointments/view/:appointment">
								<AppointmentPage />
							</Route>
							<Route path="/clinics/schedules/:clinic">
								<ClinicSchedulesPage />
							</Route>


							{/* Secretaries */}

							<Route path="/clinic/appointments/edit/:appointment">
								<SetAppointmentPage />
							</Route>
							<Route path="/clinics/secretary/edit/:clinic/:secretary">
								<SecretaryEditor />
							</Route>

							{/* Links */}
							<Route exact path="/:link">
								<Link />
							</Route>
							<Route path="/:link/appointments/create/:clinic/:doctor">
								<SetAppointmentPage />
							</Route>
							<Route path="/:link/user/login">
								<LoginPage />
							</Route>
							<Route path="/:link/user/register">
								<RegisterPage />
							</Route>
							<Route path="/:link/user/profile">
								<ProfilePage />
							</Route>
							<Route path="/:link/user/appointments/list">
								<AppointmentListPage />
							</Route>
							<Route path="/:link/user/appointments/details/:appointment">
								<AppointmentDetailsPage />
							</Route>
							<Route path="/:link/clinics/view/:clinic">
								<ClinicPage />
							</Route>
							<Route path="/:link/clinics/edit/:clinic">
								<ClinicEditor />
							</Route>
							<Route path="/:link/clinic/appointments/calendar/:clinic">
								<ClinicCalendarPage />
							</Route>
							<Route path="/:link/clinics/appointments/agenda/:clinic">
								<ClinicAgendaPage />
							</Route>
							<Route path="/:link/clinics/schedules/:clinic">
								<ClinicSchedulesPage />
							</Route>
							<Route path="/:link/clinics/schedule/edit/:clinic/:doctor">
								<ScheduleEditor />
							</Route>
							<Route path="/:link/clinics/secretary/edit/:clinic/:secretary">
								<SecretaryEditor />
							</Route>
							<Route path="/:link/clinic/appointments/view/:appointment">
								<AppointmentPage />
							</Route>
							<Route path="/:link/clinic/appointments/edit/:appointment">
								<SetAppointmentPage />
							</Route>
							<Route path="/:link/user/appointments/success/:appointment">
								<AppointmentSuccessPage />
							</Route>
							<Route path="/:link/user/appointments/deleted">
								<AppointmentDeletedPage />
							</Route>
							<Route path="/:link/doctor/appointments/details/:appointment">
								<AppointmentPage />
							</Route>
							<Route path="/:link/doctor/appointments/details/:appointment">
								<AppointmentPage />
							</Route>
						</Switch>

					<Popups />
				</ProvidePopups>
			</ProvideRoot>
		</ProvideAuth>
	</Router>,
	document.getElementById('root')
);