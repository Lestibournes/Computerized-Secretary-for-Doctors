import { fn, storage } from "../init";

const getPicture = fn.httpsCallable("users-getPicture");

export async function getPictureURL(user) {
	let image;
	let link = "";

	await getPicture({id: user}).then(location => {
		image = location.data;
	})

	await storage.child(image).getDownloadURL().then(url => {
		link = url;
	});

	return link;
}