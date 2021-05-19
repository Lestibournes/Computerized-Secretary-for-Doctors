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
import { error } from '../../../Common/functions';

import { MinimumFormPopup } from './MinimumFormPopup';
import { TypeFormPopup } from './TypeFormPopup';

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
	const [cards, setCards] = useState();

	const [popups, setPopups] = useState([]);

	function addPopup(popup) {
		let exists = false;

		for (const old_popup of popups) {
			if (old_popup.key === popup.key) {
				exists = true;
			}
		}

		if (!exists) {
			const new_popups = [...popups];
			new_popups.push(popup);
			setPopups(new_popups);
		}
	}

	function removePopup(popup) {
		const new_popups = [];

		for (const p of popups) {
			if (p !== popup) {
				new_popups.push(p);
			}
		}

		setPopups(new_popups);
	}

	useEffect(() => {
		if (clinic && doctor) {
			server.schedules.getMinimum({clinic: clinic, doctor: doctor}).then(response => {
				if (response.data.success) setMinimum(response.data.minimum);
				else {
					error(addPopup, removePopup, "Error",
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
					error(addPopup, removePopup, "Error",
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

	let subtitle;
	let display;

	const oops = [];

	if (shiftEditor !== null) {
		oops.push(
			<ShiftEditForm
				key="ShiftEditForm"
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
								error(addPopup, removePopup, "Error", 
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
		)
	}
	
	if (clinicData && doctorData && cards) {
		subtitle = doctorData.user.fullName +" at " + clinicData.name;

		display = (
			<>
				{redirect ? <Redirect to={redirect} /> : ""}
				<div className="headerbar">
					<span><b>Minimum duration:</b> {minimum} minutes.</span>
					<Button label="Edit" action={() => {
						MinimumFormPopup(addPopup, removePopup, clinic, doctor, minimum, minimum => setMinimum(minimum));
					}} />
				</div>

				<div className="headerbar">
					<h2>Appointment Types</h2>
					<Button label="+" action={() => {
						TypeFormPopup(addPopup, removePopup, clinic, doctor, null, null, null,
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
					{
						typesData ? typesData.map(type => {
							return(
								<Card
									key={type.id}
									title={type.name}
									body={type.duration * minimum + " Minutes"}
									action={() => {
										TypeFormPopup(addPopup, removePopup, clinic, doctor, type.id, type.name, type.duration,
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
						})
						: ""
					}
				</div>

				<h2>Shift Schedule</h2>
				<div className="headerbar">
					<h3>Sunday</h3> <Button label="+" action={() => setShiftEditor({day: 0})} />
				</div>
				<div className="cardList">
					{cards[0]}
				</div>

				<div className="headerbar">
					<h3>Monday</h3> <Button label="+" action={() => setShiftEditor({day: 1})} />
				</div>
				<div className="cardList">
					{cards[1]}
				</div>

				<div className="headerbar">
					<h3>Tuesday</h3> <Button label="+" action={() => setShiftEditor({day: 2})} />
				</div>
				<div className="cardList">
					{cards[2]}
				</div>

				<div className="headerbar">
					<h3>Wednesday</h3> <Button label="+" action={() => setShiftEditor({day: 3})} />
				</div>
				<div className="cardList">
					{cards[3]}
				</div>

				<div className="headerbar">
					<h3>Thursday</h3> <Button label="+" action={() => setShiftEditor({day: 4})} />
				</div>
				<div className="cardList">
					{cards[4]}
				</div>

				<div className="headerbar">
					<h3>Friday</h3> <Button label="+" action={() => setShiftEditor({day: 5})} />
				</div>
				<div className="cardList">
					{cards[5]}
				</div>

				<div className="headerbar">
					<h3>Saturday</h3> <Button label="+" action={() => setShiftEditor({day: 6})} />
				</div>
				<div className="cardList">
					{cards[6]}
				</div>
			</>
		);
	}

	return (
		<Page title={"Edit Schedule"} subtitle={subtitle} popups={popups.concat(oops)}>
			{display}
		</Page>
	);
}

function compareByName(a, b) {
	return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
}