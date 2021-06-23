//Reactjs:
import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../Common/Auth";
import { useParams } from 'react-router-dom';
import { Header } from '../../../Common/Components/Header';
import { Button } from "../../../Common/Components/Button";
import { Card } from '../../../Common/Components/Card';
import { Popup } from '../../../Common/Components/Popup'

import { Time } from "../../../Common/Classes/Time";
import { SimpleDate } from "../../../Common/Classes/SimpleDate";

import { ShiftEditForm } from './ShiftEditForm';

import { capitalize, compareByName } from '../../../Common/functions';

import { MinimumFormPopup } from './MinimumFormPopup';
import { TypeEditForm } from './TypeFormPopup';
import { usePopups } from '../../../Common/Popups';
import { db, fb } from '../../../init';

export function ScheduleEditor() {
	const auth = useAuth();
	const popups = usePopups();

	const { clinic, doctor } = useParams(); //The ID of clinic and doctor

	const [clinicData, setClinicData] = useState(null);
	const [doctorData, setDoctorData] = useState(null);
	const [typesData, setTypesData] = useState();
	const [minimum, setMinimum] = useState();

	const [schedule, setSchedule] = useState(null);
	const [shiftCards, setShiftCards] = useState();
	const [typeCards, setTypeCards] = useState();

	useEffect(() => {
		if (auth.user && !doctor) {
			db.collection("users").doc(auth.user.uid).get().then(user_snap => {
				const data = user_snap.data();
				data.id = user_snap.id;
				if (data.doctor) setDoctorData(data);
			});
		}
	}, [auth, doctor]);

	useEffect(() => {
		if (clinic && doctor) {
			// Fetch the minimum appointment duration:
			db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).onSnapshot(
				doctor_snap => {
					setMinimum(doctor_snap.data().minimum);
				},
				error => popups.error(error.message)
			);

			// Fetch all of the different appointment types this doctor has at this clinic:
			db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("types").onSnapshot(
				type_snaps => {
					const types = [];

					for (const type of type_snaps.docs) {
						if (type.data().name) {
							const data = type.data();
							data.id = type.id;
							types.push(data);
						}
					}

					types.sort(compareByName);
					setTypesData(types);
				},
				error => popups.error(error.message)
			);

			db.collection("clinics").doc(clinic).get()
			.then(clinic_snap => setClinicData(clinic_snap.data()))
			.catch(reason => popups.error(reason.code));

			db.collection("users").doc(doctor).get()
			.then(user_snap => setDoctorData(user_snap.data()))
			.catch(reason => popups.error(reason.code));

			db.collection("clinics").doc(clinic).collection("doctors").doc(doctor).collection("shifts").onSnapshot(
				shift_snaps => {
					const days = [];
					
					for (let i = 0; i < SimpleDate.day_names.length; i++) {
						days.push([]);
					}

					for (const shift of shift_snaps.docs) {
						const data = shift.data();
						data.id = shift.id;
						days[shift.data().day].push(data);
					}

					setSchedule(days);
				},
				error => popups.error(error.message)
			);
		}
	}, [clinic, doctor]);

	useEffect(() => {
		if (typesData) {
			const cards = typesData.map(type => {
				return(
					<Card
						key={type.id}
						title={type.name}
						body={type.duration * minimum + " Minutes"}
						action={() => {
							const close = () => {
								popups.remove(popup);
							};

							const popup = 
								<Popup
									key={"EditAppointmentType" + type}
									title={"Edit Appointment Type"}
									close={close}
								>
									<TypeEditForm
										key={"EditAppointmentType" + type}
										popups={popups}
										clinic={clinic}
										doctor={doctor}
										type={type}
										close={close}
									/>
								</Popup>;

							popups.add(popup);
						}}
					/>)
			});

			setTypeCards(cards);
		}
	}, [typesData, minimum]);

	useEffect(() => {
		if (schedule) {
			const temp_cards = [];
			for (const day of schedule) {
				const temp_day = [];
				
				day.sort((a, b) => {
					const time_a = Time.fromObject(a.start);
					const time_b = Time.fromObject(b.start);
					
					return time_a.compare(time_b);
				});
				
				for (const shift of day) {
					temp_day.push(
						<Card
							key={shift.id}
							title={Time.fromObject(shift.start).toString() +
							" - " + Time.fromObject(shift.end).toString()}
							action={() => {
								const close = () => {popups.remove(popup)};

								const popup =
									<Popup key={"Edit Shift" + shift.id} title="Edit Shift" close={close}>
										<ShiftEditForm
											clinic={clinic}
											doctor={doctor}
											shift={shift}
											close={close}
										/>
									</Popup>;

								popups.add(popup);
							}}
						/>
					)
				}

				temp_cards.push(temp_day);
			}
	
			setShiftCards(temp_cards);
		}
	}, [schedule]);

	let subtitle;
	let display;

	if (clinicData && doctorData && shiftCards) {
		subtitle = doctorData.fullName +" at " + clinicData.name;

		display = (
			<>
				<section>
					<header>
						<h3>Minimum duration</h3>
						<Button label="Edit" action={() => {
							MinimumFormPopup(popups, clinic, doctor, minimum, minimum => setMinimum(minimum));
						}} />
					</header>
					<div className="table">
						<b>Amount:</b> {minimum} minutes
					</div>
				</section>

				<section>
					<header>
						<h2>Appointment Types</h2>
						<Button
							label="+"
							action={() => {
								const close = () => {
									popups.remove(popup);
								};
	
								const popup = 
									<Popup
										key={"NewAppointmentType"}
										title={"Add Appointment Type"}
										close={close}
									>
										<TypeEditForm
											popups={popups}
											clinic={clinic}
											doctor={doctor}
											type={null}
											close={close}
										/>
									</Popup>;
	
								popups.add(popup);
							}}
						/>
					</header>
					<div className="cardList">
						{typeCards}
					</div>
				</section>

				<main>
					<h2>Shift Schedule</h2>
					{
						SimpleDate.day_names.map((name, number) => {
							return (
								<section key={name}>
									<header>
										<h3>{capitalize(name)}</h3>
										<Button
											label="+"
											action={() => {
												const close = () => {popups.remove(popup)};

												const popup =
													<Popup key="Create New Shift" title="Create New Shift" close={close}>
														<ShiftEditForm
															clinic={clinic}
															doctor={doctor}
															shift={{day: number}}
															close={close}
														/>
													</Popup>;

												popups.add(popup);
											}}
										/>
									</header>
									<div className="cardList">
										{shiftCards[number]}
									</div>
								</section>
							);
						})
					}
				</main>
			</>
		);
	}

	return (
		<div className="Page">
			<Header />
			<h1>Edit Schedule</h1>
			<h2>{subtitle}</h2>
			<main>
				{display}
			</main>
		</div>
	);
}