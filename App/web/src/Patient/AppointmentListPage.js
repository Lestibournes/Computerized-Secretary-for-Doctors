//Reactjs:
import { React, useEffect, useState } from 'react';
import { useAuth } from "../Common/Auth";
import { Time } from "../Common/Classes/Time";
import { SimpleDate } from "../Common/Classes/SimpleDate";
import { Card } from '../Common/Components/Card';
import { getPictureURL } from '../Common/functions';
import { server } from '../Common/server';
import { Header } from '../Common/Components/Header';
import { Loading } from '../Common/Components/Loading';
import { useRoot } from '../Common/Root';

export function AppointmentListPage() {
	const auth = useAuth();
	const root = useRoot();

	const [appointments, setAppointments] = useState(null);
	const [results, setResults] = useState(null);
	
	useEffect(() => {
		if (auth.user) {
			server.appointments.getAll({user: auth.user.uid, start: SimpleDate.fromDate(new Date()).toObject()}).then(response => {
				setAppointments(response.data);
			});
		}
  }, [auth]);

	useEffect(() => {
		if (appointments) {
			appointments.sort((a, b) => {
				const date_a = SimpleDate.fromObject(a.extra.date);
				const date_b = SimpleDate.fromObject(b.extra.date);

				const time_a = Time.fromObject(a.extra.time);
				const time_b = Time.fromObject(b.extra.time);
				
				if (date_a.compare(date_b) === 0) {
					return time_a.compare(time_b);
				}

				return date_a.compare(date_b);
			});

			// load the data and create the cards:
			let promises = [];

			for (let appointment of appointments) {
				let promise = getPictureURL(appointment.doctor.user.id).then(url => {
					appointment.image = url;

					const date = SimpleDate.fromObject(appointment.extra.date);
					const time = Time.fromObject(appointment.extra.time);
					const doctor = appointment.doctor;
					const clinic = appointment.clinic;
	
					/**
					 * @todo sort by date and time.
					 */
					return (
						<Card
							key={appointment.appointment.id}
							link={root.get() + "/user/appointments/details/" + appointment.appointment.id}
							image={appointment.image}
							altText={(doctor ? doctor.user.firstName + " " + doctor.user.lastName : null)}
							title={date.toString() + " " + time.toString() + " - " + (doctor ? doctor.user.firstName + " " + doctor.user.lastName : null)}
							body={doctor ? doctor.fields.map((field, index) => {return field.id + (index < doctor.fields.length - 1 ? " " : "")}) : null}
							footer={clinic ? clinic.name + ", " + clinic.city : null}
						/>
					);
				});
				
				promises.push(promise);
			}

			Promise.all(promises).then(cards => {
				setResults(cards);
			});
		}
	}, [appointments]);

	let display = <Loading />;

	if (results) {
		if (results.length) display = <div className="cardList">{results}</div>;
		else display = <h3>You don't have any upcoming appointments.</h3>
	}
	
	return (
		<div className="Page">
			<Header />
			<h1>My Future Appointments</h1>
			<main>
				{display}
			</main>
		</div>
	);
}