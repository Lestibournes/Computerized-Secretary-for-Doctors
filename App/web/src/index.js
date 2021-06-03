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
import { AppointmentCalendarPage } from './Calendar/AppointmentCalendarPage';
import { DoctorEditor } from './Doctor/Profile/DoctorEditor/DoctorEditor'
import { ClinicEditor } from './Doctor/Profile/ClinicEditor/ClinicEditor';
import { ScheduleEditor } from './Doctor/Profile/ClinicEditor/ScheduleEditor';
import { SetAppointmentPage } from './Patient/SetAppointmentPage';
import { SecretaryProfilePage } from './Secretary/SecretaryProfilePage';
import { ClinicPage } from './Clinic/ClinicPage';
import { SecretaryDoctorAppointmentsPage } from './Secretary/SecretaryDoctorAppointmentsPage';
import { AppointmentPage } from './Doctor/AppointmentPage';
import { SecretaryEditor } from "./Doctor/Profile/ClinicEditor/SecretaryEditor";
import { ClinicAgendaPage } from './Clinic/ClinicAgendaPage';
import { ClinicSchedulesPage } from './Clinic/ClinicSchedulesPage';
import { UserDetails } from './User/UserDetails';
import { UserProfilePage } from './User/UserProfilePage';
import { ProfilePage } from './Common/ProfilePage';
import { ProvidePopups } from './Common/Components/Page';

/**
 * URL Scheme:
 * /doctor/role/section/action/params...
 * 
 * except for MakeAppointment, in all other cases replace /specific and /general with /:doctor.
 */
ReactDOM.render(
	<ProvideAuth>
		<ProvidePopups>
			<Router>
				<Switch>

					{/* General */}

					<Redirect exact from="/" to="/general/" />
					<Route exact path="/general/">
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
					{/* <Route path="/general/profile/user">
						<ProfilePage />
					</Route>
					<Route path="/general/profile/doctor">
						<ProfilePage />
					</Route>
					<Route path="/general/profile/secretary">
						<ProfilePage />
					</Route> */}
					{/* <Route path="/general/users/profile">
						<UserProfilePage />
					</Route> */}

					{/* Patients */}

					<Route exact path="/general/searchDoctors">
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

					<Route path="/specific/secretary/profile">
						<SecretaryProfilePage />
					</Route>
					<Route path="/specific/secretary/clinics/view/:clinic">
						<ClinicPage />
					</Route>
					<Route path="/specific/secretary/clinics/:clinic/:doctor">
						<SecretaryDoctorAppointmentsPage />
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

				</Switch>
			</Router>
		</ProvidePopups>
	</ProvideAuth>,
	document.getElementById('root')
);