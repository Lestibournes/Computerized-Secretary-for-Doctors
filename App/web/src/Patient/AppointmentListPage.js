//Reactjs:
import { React, useEffect, useState } from 'react';
import { MainHeader, useAuth } from "../Common/CommonComponents";
import { Redirect } from 'react-router-dom';
import { db, fn, st } from '../init';
import { Time } from "../Common/classes";
import { Card } from '../Common/Components/Card';
import { SimpleDate } from "../Common/classes";

const storage = st.ref();

const getAppointment = fn.httpsCallable("appointments-get");

export function AppointmentListPage(props) {
	const auth = useAuth();
	const [redirect, setRedirect] = useState(false);
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (!status) setRedirect(true);
		});

		return unsubscribe;
	}, [auth]);

	const [appointments, setAppointments] = useState([]);
	const [results, setResults] = useState();
	
	useEffect(() => {
		if (auth.user) {
			db.collection("users").doc(auth.user.uid).collection("appointments").orderBy("start").where("start", ">=", new Date())
			.get().then(querySnapshot => {
				let results = [];
				let count = 0;
				
				querySnapshot.forEach(snapshot => {
					db.collection("appointments").doc(snapshot.id).get().then(appointment => {
						let result = appointment.data();
						result.id = appointment.id;
						results.push(result);
						count++;
						if (count === querySnapshot.size) {
							setAppointments(results);
						}
					});
				});
			});
		}
  }, [auth]);

	useEffect(() => {
		if (appointments) {
			// load the data and create the cards:
			const tzos = new Date().getTimezoneOffset();
			const cards = [];

			for (let appointment of appointments) {
				getAppointment(appointment).then(results => {
					const data = results.data;

					storage.child("users/" + data.doctor.user.id + "/profile.png").getDownloadURL().then(url => {
						const date = new SimpleDate(data.extra.date.year, data.extra.date.month, data.extra.date.day);
						const time = new Time(data.extra.time.hours, data.extra.time.minutes).incrementMinutes(-tzos);
						const doctor = data.doctor;
						const clinic = data.clinic;
	
						/**
						 * @todo sort by date and time.
						 */
						cards.push(
							<Card
								key={data.appointment.id}
								link={"/specific/user/appointments/edit/" + data.appointment.id}
								image={url}
								altText={(doctor ? doctor.user.firstName + " " + doctor.user.lastName : null)}
								title={date.toString() + " " + time.toString() + " - " + (doctor ? doctor.user.firstName + " " + doctor.user.lastName : null)}
								body={doctor ? doctor.fields.map((field, index) => {return field.id + (index < doctor.fields.length - 1 ? " " : "")}) : null}
								footer={clinic ? clinic.name + ", " + clinic.city : null}
							/>
						);
	
						if (cards.length === appointments.length) {
							setResults(cards);
						}
					});
				})
			}
		}
	}, [appointments]);

	return (
		<div className="page">
			{redirect ? <Redirect to="/general/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="appointment_picker">
				<h1>My Future Appointments</h1>
				<div className="searchresults">
					{results}
				</div>
			</div>
		</div>
	);
}