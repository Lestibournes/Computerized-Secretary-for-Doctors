//Reactjs:
import { React, useEffect, useState } from 'react';
import { fn } from '../init';
import { Time } from "../Common/classes";
import { Card } from '../Common/Components/Card';
import { SimpleDate } from "../Common/classes";
import { Page } from '../Common/Components/Page';
import { getPictureURL } from '../Common/functions';
import { useParams } from 'react-router-dom';

const functions = {
	doctors: {
		getAppointments: fn.httpsCallable("doctors-getAppointments"),
		getData: fn.httpsCallable("doctors-getData"),
	},
	clinics: {
		get: fn.httpsCallable("clinics-get"),
	}
}

export function SecretaryDoctorAppointmentsPage() {
	const { doctor, clinic } = useParams(); //The ID of the doctor.
	const [doctorData, setDoctorData] = useState();
	const [clinicData, setClinicData] = useState();
	const [appointments, setAppointments] = useState(null);
	const [results, setResults] = useState(null);
	
	useEffect(() => {
		if (doctor && clinic) {
			const today = new SimpleDate().toObject();
			const tomorrow = new SimpleDate().getNextDay().toObject();
			
			functions.doctors.getAppointments({doctor: doctor, clinic: clinic, start: today, end: tomorrow}).then(response => {
				setAppointments(response.data);
			});
			
			functions.doctors.getData({id: doctor}).then(results => {
				setDoctorData(results.data);
			});
			
			functions.clinics.get({id: clinic}).then(results => {
				setClinicData(results.data);
			});
		}
  }, [doctor, clinic]);

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
// console.log(appointment.extra.date, SimpleDate.fromObject(appointment.extra.date).day, SimpleDate.fromObject(appointment.extra.date).toDate());
					const date = SimpleDate.fromObject(appointment.extra.date);
					const time = Time.fromObject(appointment.extra.time);
					const doctor = appointment.doctor;
					const clinic = appointment.clinic;

					return (
						<Card
							key={appointment.appointment.id}
							link={"/specific/secretary/appointments/" + appointment.appointment.id}
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

	let display;
	let subtitle;
	let title;

	if (results && doctorData && clinicData) {
		if (results.length) display = <div className="cardList">{results}</div>;
		else display = <h3>You don't have any upcoming appointments.</h3>;
		
		subtitle = "Dr. " + doctorData.user.fullName + "'s Agenda";
		title = clinicData.name;
	}
	
	return (
		<Page title={title} subtitle={subtitle}>
			{display}
		</Page>
	);
}