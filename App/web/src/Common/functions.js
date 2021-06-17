import { db, storage } from "../init";

export async function getPictureURL(user) {
	let location;

	return db.collection("users").doc(user).get().then(user_snap => {
		if (user_snap.data().image) {
			location = "users/" + user + "/pictures/" + user_snap.data().image;
		}
		else if (user_snap.data().sex === "male") {
			location = "graphics/pictures/man";
		}
		else {
			location = "graphics/pictures/woman";
		}

		return storage.child(location).getDownloadURL().then(url => {
			return url;
		});
	});
}

/**
 * Capitalize the first letter of every word in the given text.
 * @param {string} text 
 * @returns {string}
 */
export function capitalizeAll(text) {
	const words = text.split(/\s+/);
	let result = "";

	for (const word of words) {
		result += " " + word[0].toUpperCase() + word.substr(1).toLowerCase();
	}

	return result;
}

/**
 * Capitalize the first letter of string.
 * @param {string} text 
 * @returns {string}
 */
 export function capitalize(text) {
	return text[0].toUpperCase() + text.substring(1);
}

export function compareByName(a, b) {
	return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
}

function showNotification(content, target) {
	var notification = new Notification(content);
		notification.onclick = function(event) {
			window.location = target;
		}
}

export function notify(content, target) {
	// Let's check if the browser supports notifications
	if (!("Notification" in window)) {
		alert(content);
	}
	
	// Let's check whether notification permissions have already been granted
	else if (Notification.permission === "granted") {
		// If it's okay let's create a notification
		showNotification(content, target);
	}
	
	// Otherwise, we need to ask the user for permission
	else if (Notification.permission !== "denied") {
		Notification.requestPermission().then(function (permission) {
			// If the user accepts, let's create a notification
			if (permission === "granted") {
				showNotification(content, target);
			}
		});
	}
}