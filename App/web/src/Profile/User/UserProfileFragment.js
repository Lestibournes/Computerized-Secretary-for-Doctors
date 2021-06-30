import { useAuth } from "../../Common/Auth";
import { useEffect, useState } from "react";
import { Button } from "../../Common/Components/Button";
import { capitalizeAll, getPictureURL } from "../../Common/functions";
import { userEditPopup } from "./UserEditForm";
import { usePopups } from "../../Common/Popups";
import { db, storage } from "../../init";
import { Strings } from "../../Common/Classes/strings";

export function UserProfileFragment({user}) {
	const auth = useAuth();
	const popups = usePopups();

	const [userID, setUserID] = useState();
	const [userData, setUserData] = useState();
	const [image, setImage] = useState();

	useEffect(() => {
		popups.clear();
	}, []);
	
	// Fetch the current user's id if and ID has not been provided in the props:
	useEffect(() => {
		if (user) setUserID(user);
		else if (auth?.user?.uid) setUserID(auth.user.uid);
	}, [auth, user]);
	

	// Fetch the current user's data:
	useEffect(() => {
		if (userID) {
			return db.collection("users").doc(userID).onSnapshot(
				user_snap => {
					const data = user_snap.data();
					data.id = user_snap.id;
					
					getPictureURL(data.id).then(url => setImage(url));
					setUserData(data);
				},
				error => popups.error(error.message)
			);
		}
	}, [userID]);

	if (userData) {
		return (<>
			<h2>{Strings.instance.get(110)}</h2>
			<section>
				<header>
					<h3>{Strings.instance.get(112)}</h3>
					<Button
						label={Strings.instance.get(57)}
						action={() => userEditPopup(popups, userData.id, userData, image)}
					/>
				</header>
				<div className="table">
					<b>{Strings.instance.get(65)}</b> <img src={image} alt={userData.fullName} />
					<b>{Strings.instance.get(66)}:</b> <span>{userData.fullName}</span>
					<b>{Strings.instance.get(67)}:</b>
					<span>
						{
							userData.sex === "male" ? Strings.instance.get(103) :
							userData.sex === "female" ? Strings.instance.get(104) :
							"Not specified"
						}
					</span>
				</div>
			</section>
		</>);
	}
	
	return "";
}