import { fn, storage } from "../init";

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