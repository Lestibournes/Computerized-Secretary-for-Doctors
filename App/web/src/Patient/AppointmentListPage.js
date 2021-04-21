//Reactjs:
import { React, useEffect, useState } from 'react';
import { useAuth } from "../Common/Auth";
import { fn, st } from '../init';
import { Time } from "../Common/classes";
import { Card } from '../Common/Components/Card';
import { SimpleDate } from "../Common/classes";
import { Page } from '../Common/Components/Page';

const storage = st.ref();

const getAllAppointment = fn.httpsCallable("appointments-getAll");

export function AppointmentListPage(props) {
	const auth = useAuth();
	const [appointments, setAppointments] = useState(null);
	const [results, setResults] = useState();
	
	useEffect(() => {
		if (auth.user) {
			getAllAppointment({user: auth.user.uid, start: new Date()}).then(response => {
				setAppointments(response.data);
			});
		}
  }, [auth]);

	useEffect(() => {
		if (appointments) {
			// load the data and create the cards:
			const tzos = new Date().getTimezoneOffset();
			const cards = [];
			
			const list = async () => {
				for (let appointment of appointments) {
					let image;
					await storage.child("users/" + appointment.doctor.user.id + "/profile").getDownloadURL().then(url => {
						image = url;
					}).catch(reason => {
						console.log(reason);
						image = null;
					});
	
					const date = new SimpleDate(appointment.extra.date.year, appointment.extra.date.month, appointment.extra.date.day);
					const time = new Time(appointment.extra.time.hours, appointment.extra.time.minutes).incrementMinutes(-tzos);
					const doctor = appointment.doctor;
					const clinic = appointment.clinic;
	
					/**
					 * @todo sort by date and time.
					 */
					cards.push(
						<Card
							key={appointment.appointment.id}
							link={"/specific/user/appointments/edit/" + appointment.appointment.id}
							image={image}
							altText={(doctor ? doctor.user.firstName + " " + doctor.user.lastName : null)}
							title={date.toString() + " " + time.toString() + " - " + (doctor ? doctor.user.firstName + " " + doctor.user.lastName : null)}
							body={doctor ? doctor.fields.map((field, index) => {return field.id + (index < doctor.fields.length - 1 ? " " : "")}) : null}
							footer={clinic ? clinic.name + ", " + clinic.city : null}
						/>
					);
				}
	
				setResults(cards);
			}

			list();
		}
	}, [appointments]);

	return (
		<Page
			title="My Future Appointments"
			content={<div className="cardList">{results}</div>}
		/>
	);
}