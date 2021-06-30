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
			<h2>User Profile</h2>
			<section>
				<header>
					<h3>Details</h3>
					<Button
						label="Edit"
						action={() => userEditPopup(popups, userData.id, userData, image)}
					/>
				</header>
				<div className="table">
					<b>Photo</b> <img src={image} alt={userData.fullName} />
					<b>Name:</b> <span>{userData.fullName}</span>
					<b>Sex:</b>
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