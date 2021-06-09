import { useEffect, useState } from "react";
import { useAuth } from "../Auth";
import { SimpleDate } from "../Classes/SimpleDate";
import { Time } from "../Classes/Time";
import { notify } from "../functions";
import { events, server } from "../server";

export function Notifier() {
	const auth = useAuth();
	const [doctor, setDoctor] = useState(null);

	useEffect(() => {
		if (auth.user && doctor === null) {
			server.doctors.getID({user: auth.user.uid}).then(response => {
				if (response.data) {
					server.doctors.getData({id: response.data}).then(results => {
						setDoctor(results.data);
					});
				}
				else {
					setDoctor(false);
				}
			});
		}
	}, [auth, doctor]);

	useEffect(() => {
		if (doctor && auth?.user) {
			return events.doctors.arrival(doctor.doctor.id, (appointment_id, arrived) => {
				if (arrived && arrived !== auth.user.uid) {
					server.appointments.get({id: appointment_id}).then(response => {
						const data = response.data.data;
						notify(
							"Patient " + data.patient.fullName +
							" has arrived for " + (data.patient.sex === "male" ? "his " : "her ") +
							SimpleDate.fromObject(data.extra.date) + " " +
							Time.fromObject(data.extra.time).toString() +
							" appointment.", "/specific/doctor/appointments/details/" + appointment_id);
					});
				}
			});
		}
	}, [doctor, auth.user]);

	return (<></>);
}