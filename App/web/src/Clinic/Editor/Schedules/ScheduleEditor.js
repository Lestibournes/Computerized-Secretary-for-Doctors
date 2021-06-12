//Reactjs:
import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../Common/Auth";
import { useParams } from 'react-router-dom';
import { Header } from '../../../Common/Components/Header';
import { Button } from "../../../Common/Components/Button";
import { Card } from '../../../Common/Components/Card';

import { Time } from "../../../Common/Classes/Time";
import { SimpleDate } from "../../../Common/Classes/SimpleDate";

import { shiftEditPopup } from './ShiftEditForm';
import { server } from '../../../Common/server';
import { capitalize, compareByName } from '../../../Common/functions';

import { MinimumFormPopup } from './MinimumFormPopup';
import { TypeFormPopup } from './TypeFormPopup';
import { usePopups } from '../../../Common/Popups';

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
		const unsubscribe = auth.isLoggedIn(status => {
			if (auth.user && !doctor) {
				server.users.isDoctor({id: auth.user.uid}).then(response => {
					if (response.data) {
						server.doctors.getData({id: auth.user.uid}).then(doctor_data => {
							setDoctorData(doctor_data.data);
						});
					}
				});
			}
		});

		return unsubscribe;
	}, [auth, doctor]);

	useEffect(() => {
		if (clinic && doctor) {
			server.schedules.getMinimum({clinic: clinic, doctor: doctor}).then(response => {
				if (response.data.success) setMinimum(response.data.minimum);
				else popups.error(response.data.message)
			});

			server.schedules.getTypes({clinic: clinic, doctor: doctor}).then(response => {
				if (response.data.success) {
					const types = [];

					for (const type of response.data.types) {
						if (type.name) {
							types.push(type);
						}
					}

					types.sort(compareByName);
					setTypesData(types);
				}
				else popups.error(response.data.message)
			});

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
		if (typesData) {
			const cards = typesData.map(type => {
				return(
					<Card
						key={type.id}
						title={type.name}
						body={type.duration * minimum + " Minutes"}
						action={() => {
							TypeFormPopup(popups, clinic, doctor, type.id, type.name, type.duration,
								new_type => {
									const new_types = [];

									for (const old_type of typesData) {
										if (old_type.id !== new_type.id) {
											new_types.push(old_type);
										}
									}

									if (new_type.name) {
										new_types.push(new_type);
									}

									new_types.sort(compareByName);

									setTypesData(new_types);
								}
							);
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
								shiftEditPopup(
									popups, clinic, doctor, shift.id, shift.day, shift.start, shift.end,
									result => updateSchedule(popups, result).then(data => setSchedule(data))
								)
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
		subtitle = doctorData.user.fullName +" at " + clinicData.name;

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
						<Button label="+" action={() => {
							TypeFormPopup(popups, clinic, doctor, null, null, null,
								new_type => {
									const new_types = [...typesData];

									if (new_type.name) {
										new_types.push(new_type);
									}

									new_types.sort(compareByName);

									setTypesData(new_types);
								}
							);
						}} />
					</header>
					<div className="cardList">
						{typeCards}
					</div>
				</section>

				<section>
					<h2>Shift Schedule</h2>
					{
						SimpleDate.day_names.map((name, number) => {
							return (
								<>
									<section>
										<header>
											<h3>{capitalize(name)}</h3>
											<Button
												label="+"
												action={() => {
													shiftEditPopup(
														popups, clinic, doctor, null, number, null, null,
														result => updateSchedule(popups, result).then(data => setSchedule(data))
													)
												}}
											/>
										</header>
										<div className="cardList">
											{shiftCards[number]}
										</div>
									</section>
								</>
							);
						})
					}
				</section>
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

async function updateSchedule(popupManager, result) {
	if (!result.success) popupManager.error(result.message)

	return server.schedules.get({doctor: result.data.doctor, clinic: result.data.clinic}).then(response => {
		return response.data;
	});
}