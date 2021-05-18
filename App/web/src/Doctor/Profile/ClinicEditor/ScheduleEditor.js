//Reactjs:
import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../Common/Auth";
import { Redirect, useParams } from 'react-router-dom';
import { Button } from "../../../Common/Components/Button";
import { Page } from "../../../Common/Components/Page";
import { Card } from '../../../Common/Components/Card';

import { Time } from '../../../Common/classes';
import { ShiftEditForm } from './ShiftEditForm';
import { server } from '../../../Common/server';
import { message } from '../../../Common/functions';

export function ScheduleEditor() {
	const auth = useAuth();
	
	useEffect(() => {
		const unsubscribe = auth.isLoggedIn(status => {
			if (auth.user) {
				server.doctors.getID({user: auth.user.uid}).then(response => {
					server.doctors.getData({id: response.data}).then(doctor_data => {
						setDoctorData(doctor_data.data);
					});
				});
			}
		});

		return unsubscribe;
	}, [auth]);

	const { clinic, doctor } = useParams(); //The ID of clinic and doctor

	const [clinicData, setClinicData] = useState(null);
	const [doctorData, setDoctorData] = useState(null);
	
	const [redirect, setRedirect] = useState(null); //Where to redirect to in case the doctor is removed from the clinic.

	const [shiftEditor, setShiftEditor] = useState(null);
	const [schedule, setSchedule] = useState(null);
	const [cards, setCards] = useState();

	const [oops, setPopups] = useState([]);
	
	// const [sunday, setSunday] = useState();
	// const [monday, setMonday] = useState();
	// const [tuesday, setTuesday] = useState();
	// const [wednesday, setWednesday] = useState();
	// const [thursday, setThursday] = useState();
	// const [friday, setFriday] = useState();
	// const [saturday, setSaturday] = useState();

	useEffect(() => {
		if (clinic && doctor) {
			server.clinics.get({id: clinic}).then(clinic_data => {
				setClinicData(clinic_data.data);

				server.doctors.getData({id: doctor}).then(doctor_data => {
					setDoctorData(doctor_data.data);

					server.schedules.get({doctor: doctor, clinic: clinic}).then(response => {
						setSchedule(response.data);
					});
				});
			});
		}
	}, [clinic, doctor]);

	useEffect(() => {
		if (schedule) {
			const temp_cards = [];
	
			for (const day of schedule) {
				const temp_day = [];

				for (const shift of day) {
					temp_day.push(
						<Card
							key={shift.id}
							title={Time.fromObject(shift.start).toString() +
							" - " + Time.fromObject(shift.end).toString()}
							body={"Minimum duration: " + shift.min + " minutes"}
							action={() => setShiftEditor({
								shift: shift.id,
								day: shift.day,
								start: shift.start,
								end: shift.end,
								min: shift.min
							})}
						/>
					)
				}

				temp_cards.push(temp_day);
			}
	
			setCards(temp_cards);
		}
	}, [schedule]);

	let display = <h2>Loading...</h2>;
	const popups = 
	<>
		{shiftEditor !== null ?
			<ShiftEditForm
				doctor={doctor}
				clinic={clinic}
				{...shiftEditor}
				close={() => setShiftEditor(null)}
				success={data => {
					if (data.shift) {
						server.schedules.edit(data).then(result => {
							if (result.data.success) {
								server.schedules.get({doctor: doctor, clinic: clinic}).then(response => {
									setSchedule(response.data);
									setShiftEditor(null);
								});
							}

							else {
								message(oops, setPopups, "Error", 
								<div>
									{result.data.message}
								</div>)
							}
						});
					}
					else {
						server.schedules.add(data).then(() => {
							server.schedules.get({doctor: doctor, clinic: clinic}).then(response => {
								setSchedule(response.data);
								setShiftEditor(null);
							});
						});
					}
				}}
				deleted={() => {
					server.schedules.get({doctor: doctor, clinic: clinic}).then(response => {
						setSchedule(response.data);
						setShiftEditor(null);
					});
				}}
			/>
		: ""}
	</>;
	
	if (clinicData && doctorData && cards) {
		display = (
			<>
				{redirect ? <Redirect to={redirect} /> : ""}
				<div className="table">
					<b>Clinic:</b> <span>{clinicData.name}</span>
					<b>Doctor:</b> <span>{doctorData.user.fullName}</span>
				</div>

				<div className="headerbar">
					<h2>Sunday</h2> <Button label="+" action={() => setShiftEditor({day: 0})} />
				</div>
				<div className="cardList">
					{cards[0]}
				</div>

				<div className="headerbar">
					<h2>Monday</h2> <Button label="+" action={() => setShiftEditor({day: 1})} />
				</div>
				<div className="cardList">
					{cards[1]}
				</div>

				<div className="headerbar">
					<h2>Tuesday</h2> <Button label="+" action={() => setShiftEditor({day: 2})} />
				</div>
				<div className="cardList">
					{cards[2]}
				</div>

				<div className="headerbar">
					<h2>Wednesday</h2> <Button label="+" action={() => setShiftEditor({day: 3})} />
				</div>
				<div className="cardList">
					{cards[3]}
				</div>

				<div className="headerbar">
					<h2>Thursday</h2> <Button label="+" action={() => setShiftEditor({day: 4})} />
				</div>
				<div className="cardList">
					{cards[4]}
				</div>

				<div className="headerbar">
					<h2>Friday</h2> <Button label="+" action={() => setShiftEditor({day: 5})} />
				</div>
				<div className="cardList">
					{cards[5]}
				</div>

				<div className="headerbar">
					<h2>Saturday</h2> <Button label="+" action={() => setShiftEditor({day: 6})} />
				</div>
				<div className="cardList">
					{cards[6]}
				</div>
			</>
		);
	}

	return (
		<Page title={"Edit Schedule"} popups={oops}>
			{display}
			{popups}
		</Page>
	);
}