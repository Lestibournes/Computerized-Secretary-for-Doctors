import { useEffect, useState } from "react";
import { db } from "../../init";
import { useAuth } from "../Auth";
import { SimpleDate } from "../Classes/SimpleDate";
import { Time } from "../Classes/Time";
import { notify } from "../functions";
import { usePopups } from "../Popups";
import { useRoot } from "../Root";
import { events } from "../server";

/**
 * Use native notifications to notify doctors about patient arrival.
 */
export function Notifier() {
	const root = useRoot();
	const auth = useAuth();
	const popups = usePopups();

	useEffect(() => {
		if (auth?.user?.uid) {
			return db.collection("users").doc(auth.user.uid).onSnapshot(
				user_snap => {
					if (user_snap.exists && user_snap.data().doctor) {
						return events.doctors.appointments(user_snap.id, ((oldData, newData) => {
							if (oldData.arrived !== newData.arrived) {
								db.collection("users").doc(newData.patient).get()
								.then(patient_snap => {
									notify(
										"Patient " + patient_snap.data().fullName +
										" has arrived for " + (patient_snap.data().sex === "male" ? "his " : "her ") +
										new SimpleDate(newData.start).toString() + " " +
										Time.fromDate(newData.start).toString() +
										" appointment.", root.get() + "/doctor/appointments/details/" + newData.clinic + "/" + newData.id);
									}).catch(reason => console.log(reason))
							}
						}))
					}
				},
				error => popups.error(error.message)
			);
		}
	}, [auth.user]);

	return (<></>);
}