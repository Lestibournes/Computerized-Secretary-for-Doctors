import { fn, storage } from "../init";

const getPicture = fn.httpsCallable("users-getPicture");

export async function getPictureURL(user) {
	return getPicture({id: user}).then(location => {
		return storage.child(location.data).getDownloadURL().then(url => {
			return url;
		});
	});
}