//Reactjs:
import { React, useEffect, useState } from 'react';
import { MainHeader, useAuth } from "./CommonComponents";
import { Link, Redirect } from 'react-router-dom';
import { db, fn, storage } from './init';
import { Time } from "./classes";

const getDoctor = fn.httpsCallable("getDoctor");

function AppointmentCard(props) {
	const [profile, setProfile] = useState(null);
	const [doctor, setDoctor] = useState(null);
	const [clinic, setClinic] = useState(null);

	useEffect(() => {
		getDoctor({
			id: props.data.doctor,
			clinic: props.data.clinic
		}).then(result => {
			setDoctor(result.data);
			
			storage.child("users/" + result.data.user.id + "/profile.png").getDownloadURL().then(url => {
				setProfile(url);
			});
		});
	
		db.collection("clinics").doc(props.data.clinic).get().then(result => {
			setClinic(result.data());
		});
  }, [props.data.doctor, props.data.clinic]);

	const date = new Date(props.data.start.toDate());
	const tzos = date.getTimezoneOffset();

	const time = new Time(date.getUTCHours(), date.getUTCMinutes()).incrementMinutes(-tzos);

	return (<div className="entryCard">
		<img alt="doctor's face" src={profile} />
		<div className="cardTop">
			<big>{date.getUTCFullYear()}/{date.getUTCMonth() + 1}/{date.getUTCDate()} {time.toString()} - {doctor ? doctor.user.firstName + " " + doctor.user.lastName : null}</big>
			<div className="buttonBar">
				<Link className="button">Chat</Link>
				<Link className="button">Details</Link>
				<Link to={"/edit/" + props.data.id} className="button">Edit</Link>
			</div>
		</div>
		<div className="cardCenter"><small>{doctor ? doctor.fields.map((field, index) => {return field.id + (index < doctor.fields.length - 1 ? " " : "")}) : null}</small></div>
		<div className="cardBottom"><small>{clinic ? clinic.name + ", " + clinic.city : null}</small></div>
		</div>)
}

export function AppointmentListPage(props) {
	const auth = useAuth();
	const [appointments, setAppointments] = useState([]);
	
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
  }, [auth.user]);
	
	let elements = [];

	appointments.forEach(appointment => {	
		elements.push(<AppointmentCard key={appointment.id} data={appointment} />);
	});

	return (
		<div className="page">
			{!auth.user ? <Redirect to="/login" /> : null }
			<MainHeader section="Home"></MainHeader>
			<div className="content">

				<div className="appointment_picker">
					<h1>My Future Appointments</h1>
					<div className="searchresults">
						{appointments && appointments.length > 0 ? elements : <div>no appointments to show</div>}
					</div>
				</div>
			</div>
		</div>
	);
}