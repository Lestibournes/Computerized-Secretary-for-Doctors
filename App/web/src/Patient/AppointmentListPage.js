//Reactjs:
import { React, useEffect, useState } from 'react';
import { useAuth } from "../Common/Auth";
import { fn } from '../init';
import { Time } from "../Common/classes";
import { Card } from '../Common/Components/Card';
import { SimpleDate } from "../Common/classes";
import { Page } from '../Common/Components/Page';
import { getPictureURL } from '../Common/functions';

const getAllAppointment = fn.httpsCallable("appointments-getAll");

export function AppointmentListPage() {
	const auth = useAuth();
	const [appointments, setAppointments] = useState(null);
	const [results, setResults] = useState(null);
	
	useEffect(() => {
		if (auth.user) {
			getAllAppointment({user: auth.user.uid, start: SimpleDate.fromDate(new Date()).toObject()}).then(response => {
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
							link={"/specific/user/appointments/edit/" + appointment.appointment.id}
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

	let display = <h3>Loading...</h3>;

	if (results) {
		if (results.length) display = <div className="cardList">{results}</div>;
		else display = <h3>You don't have any upcoming appointments.</h3>
	}
	
	return (
		<Page
			title="My Future Appointments"
			content={display}
		/>
	);
}