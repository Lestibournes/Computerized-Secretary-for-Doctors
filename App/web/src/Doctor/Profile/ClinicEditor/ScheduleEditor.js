//Reactjs:
import React, { useEffect, useState } from 'react';
import { useAuth } from "../../../Common/Auth";
import { Redirect, useParams } from 'react-router-dom';
import { Button } from "../../../Common/Components/Button";
import { Page, usePopups } from "../../../Common/Components/Page";
import { Card } from '../../../Common/Components/Card';

import { Time } from '../../../Common/classes';
import { shiftEditPopup } from './ShiftEditForm';
import { server } from '../../../Common/server';
import { capitalize, compareByName, error } from '../../../Common/functions';

import { MinimumFormPopup } from './MinimumFormPopup';
import { TypeFormPopup } from './TypeFormPopup';
import { SimpleDate } from "../../../Common/classes";

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
	const [typesData, setTypesData] = useState();
	const [minimum, setMinimum] = useState();
	
	const [redirect, setRedirect] = useState(null); //Where to redirect to in case the doctor is removed from the clinic.

	const [shiftEditor, setShiftEditor] = useState(null);
	const [schedule, setSchedule] = useState(null);
	const [shiftCards, setShiftCards] = useState();
	const [typeCards, setTypeCards] = useState();

	const popupManager = usePopups();

	useEffect(() => {
		if (clinic && doctor) {
			server.schedules.getMinimum({clinic: clinic, doctor: doctor}).then(response => {
				if (response.data.success) setMinimum(response.data.minimum);
				else {
					error(popupManager,
						<div>
							{response.data.message}
						</div>
					);
				}
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
				else {
					error(popupManager,
						<div>
							{response.data.message}
						</div>
					);
				}
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
							TypeFormPopup(popupManager, clinic, doctor, type.id, type.name, type.duration,
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
									popupManager, clinic, doctor, shift.id, shift.day, shift.start, shift.end,
									result => updateSchedule(popupManager, result).then(data => setSchedule(data))
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
				{redirect ? <Redirect to={redirect} /> : ""}
				<div className="headerbar">
					<span><b>Minimum duration:</b> {minimum} minutes.</span>
					<Button label="Edit" action={() => {
						MinimumFormPopup(popupManager, clinic, doctor, minimum, minimum => setMinimum(minimum));
					}} />
				</div>

				<div className="headerbar">
					<h2>Appointment Types</h2>
					<Button label="+" action={() => {
						TypeFormPopup(popupManager, clinic, doctor, null, null, null,
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
				</div>
				<div className="cardList">
					{typeCards}
				</div>

				<h2>Shift Schedule</h2>
				{
					SimpleDate.day_names.map((name, number) => {
						return (
							<>
								<div className="headerbar">
									<h3>{capitalize(name)}</h3>
									<Button
										label="+"
										action={() => {
											shiftEditPopup(
												popupManager, clinic, doctor, null, number, null, null,
												result => updateSchedule(popupManager, result).then(data => setSchedule(data))
											)
										}}
									/>
								</div>
								<div className="cardList">
									{shiftCards[number]}
								</div>
							</>
						);
					})
				}
			</>
		);
	}

	return (
		<Page title={"Edit Schedule"} subtitle={subtitle}>
			{display}
		</Page>
	);
}

async function updateSchedule(popupManager, result) {
	if (!result.success) {
		error(popupManager, 
			<div>
			{result.message}
		</div>)
	}

	return server.schedules.get({doctor: result.data.doctor, clinic: result.data.clinic}).then(response => {
		return response.data;
	});
}