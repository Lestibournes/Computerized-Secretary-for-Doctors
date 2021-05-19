import { fb, storage } from "../init";
import { Button } from "./Components/Button";
import {Popup} from "./Components/Popup";

const fn = fb.functions();

const getPicture = fn.httpsCallable("users-getPicture");

export async function getPictureURL(user) {
	return getPicture({id: user}).then(location => {
		return storage.child(location.data).getDownloadURL().then(url => {
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

/**
 * 
 * @param {() => []} getPopups A function to get array that holds the Page's displayed popups.
 * @param {([]) => {}} setPopups A function to update the Page's displayed popups.
 * @param {string} title The title of the popup.
 * @param {*} body JSX of the Popup body.
 */
export function error(addPopup, removePopup, body) {
	const close = () => {
		removePopup(popup);
	};

	const popup = 
	<Popup
		key={Math.random()}
		title="Error"
		close={close}
	>
		{body}
		<div className="buttonBar">
			<Button label="Close" action={close} />
		</div>
	</Popup>;

	addPopup(popup);
}

export function compareByName(a, b) {
	return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
}