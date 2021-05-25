import { useAuth } from "../Common/Auth";
import { useEffect, useState } from "react";
import { Button } from "../Common/Components/Button";
import { capitalizeAll, getPictureURL } from "../Common/functions";
import { server } from "../Common/server";
import { UserEditPopup } from "./UserEditForm";

export function UserDetails({user, data, popupManager}) {
	const auth = useAuth();

	const [userID, setUserID] = useState();
	const [userData, setUserData] = useState();
	const [image, setImage] = useState();

	// Fetch the current user's id if and ID has not been provided in the props:
	useEffect(() => {
		if (user) {
			setUserID(user);
		}
		else {
			const unsubscribe = auth.isLoggedIn(status => {
				if (auth.user) setUserID(auth.user.uid);
			});
	
			return unsubscribe;
		}
	}, [auth, user]);
	

	// Fetch the current user's data:
	useEffect(() => {
		if (data) {
			setUserData(data);
		}
		else if (userID) {
			server.users.get({user: userID}).then(response => {
				setUserData(response.data);
			})
		}
	}, [data, userID]);

	// Fetch the current user's profile picture:
	useEffect(() => {
		if (userID) {
			getPictureURL(userID).then(url => {
				setImage(url);
			});
		}
	}, [userID]);

	if (userID && userData) {
		return (
			<>
				<div className="headerbar">
					<h2>Details</h2>
					<Button
						label="Edit"
						action={() => UserEditPopup(popupManager, userID, userData, image, () => {
							server.users.get({user: userID}).then(response => {
								getPictureURL(userID).then(url => {
									setImage(url);
								});
								setUserData(response.data);
							})
						})}
					/>
				</div>
				<div className="table">
					<b>Photo</b> <img src={image} alt={userData.fullName} />
					<b>Name:</b> <span>{userData.fullName}</span>
					<b>Sex:</b> <span>{userData.sex ? capitalizeAll(userData.sex) : "Not specified"}</span>
				</div>
			</>
		);
	}
	
	return "";
}