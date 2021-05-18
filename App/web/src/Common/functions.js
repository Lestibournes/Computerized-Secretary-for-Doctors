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
 * @param {[]} popups The array that holds the Page's displayed popups.
 * @param {(popups: []) => {}} setPopups A function to update the Page's displayed popups.
 * @param {string} title The title of the popup.
 * @param {*} body JSX of the Popup body.
 */
export function message(popups, setPopups, title, body) {
	let oops = [...popups];

	const close = () => {
		const temp = [];

		for (const item of oops) {
			if (item !== popup) temp.push(item);
		}

		setPopups(temp);
	};

	const popup = 
	<Popup
		key={Math.random()}
		title={title}
		close={close}
	>
		{body}
		<div className="buttonBar">
			<Button label="Close" action={close} />
		</div>
	</Popup>;

	oops.push(popup);
	setPopups(oops);
}