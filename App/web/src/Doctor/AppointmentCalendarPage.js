//Reactjs:
import { React, useEffect, useState } from 'react';
import { useAuth } from "../Common/Auth";
import { db } from '../init';
import { Slot, Time } from "../Common/classes";
import { CalendarWeek } from "../Common/Components/CalendarComponents";
import { Button } from '../Common/Components/Button';
import { Page } from '../Common/Components/Page';

export function AppointmentCalendarPage() {
	const auth = useAuth();

	const [doctor, setDoctor] = useState(null);
	const [date, setDate] = useState(new Date());
	const [appointments, setAppointments] = useState([[], [], [], [], [], [], []]);
	const [schedule, setSchedule] = useState(new Slot(new Time(8, 30), new Time(16, 30)));
	const [minimum, setMinimum] = useState(60);
	const [colors, setColors] = useState({
		"new patient": 120,
		"regular": 240,
		"follow up": 360
	});

	async function getAppointments() {
		const sunday = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getDate() - date.getDay());
		const saturday = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getDate() + (6 - date.getDay()));
		const end = new Date(saturday.getUTCFullYear(), saturday.getUTCMonth(), saturday.getUTCDate() + 2);

		let current = sunday;
		let next = new Date(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + 2);

		const appointments = [];

		while (current < end) {
			const today = [];

			await db.collection("doctors").doc(doctor.id).collection("appointments").orderBy("start").startAt(current).endAt(next).get().then(snaps => {

				snaps.forEach(snap => {
					let start = new Date();
					start = snap.data().start.toDate();
					const start_time = new Time(start.getUTCHours(), start.getUTCMinutes()).incrementMinutes(-start.getTimezoneOffset());

					let name = snap.data().patient;
					
					today.push({
						color: "white",
						background: "hsl(" + colors[snap.data().type] + ", 100%, 30%)",
						duration: snap.data().duration,
						start: start_time,
						id: snap.id,
						name: name
					});
				})
				
			});
			
			for (let i = 0; i < today.length; i++) {
				await db.collection("users").doc(today[i].name).get().then(user => {
					today[i].name = user.data().firstName + " " + user.data().lastName;
				});
			}
			
			appointments.push(today);
			
			current = next;
			next = new Date(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate() + 2)
		}

		setAppointments(appointments);
	}

	async function getSchedule() {
		let start;
		let end;
		let minimum;

		await db.collection("slots").where("doctor", "==", doctor.id).get().then(snaps => {
			snaps.forEach(snap => {
				const types = snap.data().types;
				for (let type of Object.keys(types)) {
					if (!minimum || types[type] < minimum) {
						minimum = types[type];
					}
				}

				const week = snap.data().weekly;
				for (let day of Object.keys(week)) {
					for (let i = 0; i < week[day].length; i++) {
						let start_date = new Date();
						start_date = week[day][i].start.toDate();

						let start_time = new Time(start_date.getUTCHours(), start_date.getUTCMinutes()).incrementMinutes(-start_date.getTimezoneOffset());

						if (!start || start_time.compareTime(start) < 0) {
							start = start_time;
						}

						let end_date = new Date();
						end_date = week[day][i].end.toDate();

						let end_time = new Time(end_date.getUTCHours(), end_date.getUTCMinutes()).incrementMinutes(-end_date.getTimezoneOffset());
						
						if (!end || end_time.compareTime(end) > 0) {
							end = end_time;
						}
					}
				}
			});
		});

		setSchedule(new Slot(start, end));
		// setMinimum(minimum);
	}
		
	useEffect(() => {
		if (auth.user) {
			if (!doctor) {
				// Check if the current user is a doctor, and if he is, fetch his doctor id/ref:
				const userRef = db.collection("users").doc(auth.user.uid);
				db.collection("doctors").where("user", "==", userRef).get().then(snaps => {
					snaps.forEach(snap => {
						setDoctor(snap);
						return;
					});
				});
			}
			else {
				// Fetch the current doctor's appointments:
				getAppointments();
				getSchedule();
			}
		}
	}, [doctor, date]);

	return (
		<>
			<Page
				title="Work Calendar"
				content={
					<>
						<div className="buttonBar">
							<Button action={() => {
								setDate(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - 7));
								}} label="<" />
							<Button action={() => {
								setDate(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 7));
								}} label=">" />
						</div>
						<CalendarWeek
							date={date}
							appointments={appointments}
							schedule={schedule}
							minimum={minimum}
							width={200}
							height={960}
						/>
					</>
				}
			/>
		</>
	);
}