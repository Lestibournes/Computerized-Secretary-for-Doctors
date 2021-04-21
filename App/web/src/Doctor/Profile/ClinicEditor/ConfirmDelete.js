import { useState } from "react";
import { Button } from "../../../Common/Components/Button";
import { Popup } from "../../../Common/Components/Popup";
import { fn } from "../../../init";

const deleteClinic = fn.httpsCallable("clinics-delete");

export function ConfirmDelete({clinic, doctor, close, success}) {
	const [problem, setProblem] = useState(null);

	return (
	<Popup
		title="Confirm Deletion"
		display={
			<>
				<p>Are you sure you wish to delete this clinic?</p>
				<p>This action is permanent and cannot be undone.</p>
				<div className="buttonBar">
					<Button type="cancel" label="Yes" action={() => {
						deleteClinic({id: clinic, doctor: doctor}).then(response => {
							if (!response.data.success) {setProblem(response.data.message)}
							else {success()}
						});
					}} />
					<Button type="okay" label="Cancel" action={close} />
					{problem ? <Popup title="Error" display={<div>{problem}</div>} close={() => setProblem(false)} /> : ""}
				</div>
			</>
		}
		close={close}
	/>);
}