const firebase = require('@firebase/testing');
const { projectId, thisAuth, thisUserData, otherAuth, otherUserData, getFirestore, getAdminFirestore } = require('./shared');

// Clear all the data before each test to make sure that each test happens in isolation:
beforeEach(() => {
	return firebase.clearFirestoreData({projectId: projectId});
});

// Clear all the data after the last test to make sure no crud is left over:
afterAll(() => {
	return firebase.clearFirestoreData({projectId: projectId});
});

describe("User profile document CRUD permissions", () => {
	test("Setting the user's own data", async () => {
		// Setting up the test:
		const db = getFirestore(thisAuth);
		const userRef = db.collection("users").doc(thisAuth.uid);
	
		// Performing the test:
		// Should succeed because each user is supposed to be able to create or update his own document:
		expect(await firebase.assertSucceeds(userRef.set(thisUserData)));
	});
	
	test("Setting another user's data", async () => {
		// Setting up the test:
		const db = getFirestore(thisAuth);
		const userRef = db.collection("users").doc(otherAuth.uid);
	
		// Performing the test:
		// Should fail because each user is only supposed to be able to create or update his own document:
		expect(await firebase.assertFails(userRef.set(thisUserData)));
		expect(await firebase.assertFails(userRef.set(otherUserData)));
	});
	
	test("Updating the user's own data", async () => {
		// Setting up the test:
		const db = getFirestore(thisAuth);
		const userRef = db.collection("users").doc(thisAuth.uid);
	
		userRef.set(thisUserData);

		// Performing the test:
		// Some of these should fail because the data is invalid. Others should succeed because the data is valid:
		expect(await firebase.assertFails(userRef.update({firstName: "Mike"})));
		expect(await firebase.assertFails(userRef.update({lastName: "Vick"})));
		expect(await firebase.assertFails(userRef.update({firstName: "Mike", lastName: "Vick"})));
		expect(await firebase.assertSucceeds(userRef.update({firstName: "Mike", lastName: "Vick", fullName: "Mike Vick"})));
	
		expect(await firebase.assertFails(userRef.update({sex: "malen"})));
		expect(await firebase.assertSucceeds(userRef.update({sex: "female"})));
	});
	
	test("Updating another user's data", async () => {
		// Setting up the test:
		const db = getFirestore(thisAuth);
		const userRef = db.collection("users").doc(otherAuth.uid);
	
		getAdminFirestore().collection("users").doc(otherAuth.uid).set(otherUserData);
		
		// Performing the test:
		// All of these should fail because a user is only supposed to be able to update his own document:
		expect(await firebase.assertFails(userRef.update({firstName: "Mike"})));
		expect(await firebase.assertFails(userRef.update({lastName: "Vick"})));
		expect(await firebase.assertFails(userRef.update({firstName: "Mike", lastName: "Vick"})));
		expect(await firebase.assertFails(userRef.update({firstName: "Mike", lastName: "Vick", fullName: "Mike Vick"})));
	
		expect(await firebase.assertFails(userRef.update({sex: "malen"})));
		expect(await firebase.assertFails(userRef.update({sex: "female"})));
	});
	
	test("Getting the user's own data", async () => {
		// Setting up the test:
		const db = getFirestore(thisAuth);
		const userRef = db.collection("users").doc(thisAuth.uid);
	
		userRef.set(thisUserData);
	
		// Performing the test:

		// All of these should succeed because the data is supposed to be public:
		expect(await firebase.assertSucceeds(userRef.get()));
	
		return userRef.get().then(user_snap => {
			expect(user_snap.exists).toBe(true);
			expect(user_snap.data()).toBeTruthy();
			expect(user_snap.data().firstName).toBe(thisUserData.firstName);
			expect(user_snap.data().lastName).toBe(thisUserData.lastName);
			expect(user_snap.data().fullName).toBe(thisUserData.fullName);
			expect(user_snap.data().sex).toBe(thisUserData.sex);
		});
	});
	
	test("Getting another user's data", async () => {
		// Setting up the test:
		const db = getFirestore(thisAuth);
		const userRef = db.collection("users").doc(otherAuth.uid);
	
		getAdminFirestore().collection("users").doc(otherAuth.uid).set(otherUserData);
	
		// Performing the test:

		// All of these should succeed because the data is supposed to be public:
		expect(await firebase.assertSucceeds(userRef.get()));
	
		return userRef.get().then(user_snap => {
			expect(user_snap.exists).toBe(true);
			expect(user_snap.data()).toBeTruthy();
			expect(user_snap.data().firstName).toBe(otherUserData.firstName);
			expect(user_snap.data().lastName).toBe(otherUserData.lastName);
			expect(user_snap.data().fullName).toBe(otherUserData.fullName);
			expect(user_snap.data().sex).toBe(otherUserData.sex);
		});
	});
	
	test("Deleting the user's own data", async () => {
		// Setting up the test:
		const db = getFirestore(thisAuth);
		const userRef = db.collection("users").doc(thisAuth.uid);
	
		// Performing the test:
		expect(await firebase.assertFails(userRef.delete())); // Should fail because the rules prohibit deleting the user document.
	});
	
	test("Deleting another user's data", async () => {
		// Setting up the test:
		const db = getFirestore(thisAuth);
		const userRef = db.collection("users").doc(otherAuth.uid);
	
		// Performing the test:
		expect(await firebase.assertFails(userRef.delete())); // Should fail because the rules prohibit deleting the user document.
	});
});

describe("Being a doctor", () => {
	test("The current user is not a doctor", async () => {
		// Setting up the test:
		const db = getFirestore(thisAuth);
		const userRef = db.collection("users").doc(thisAuth.uid);
		
		await userRef.set(thisUserData);
		const userSnap = await userRef.get();

		// Performing the test:
		expect(userSnap.data().doctor).not.toBe(true);
	});

	test("The other user is not a doctor", async () => {
		// Setting up the test:
		await getAdminFirestore().collection("users").doc(otherAuth.uid).set(otherUserData);
		const userSnap = await getFirestore(thisAuth).collection("users").doc(otherAuth.uid).get();

		// Performing the test:
		expect(userSnap?.data()?.doctor).toBeFalsy();
	});

	test("Making the current user a doctor", async () => {
		// Setting up the test:
		const db = getFirestore(thisAuth);
		const userRef = db.collection("users").doc(thisAuth.uid);
		
		await userRef.set(thisUserData);
		
		// Performing the test:
		expect(await firebase.assertSucceeds(userRef.update({doctor: true})));
		expect(await firebase.assertFails(userRef.update({doctor: "true"})));
		expect(await firebase.assertFails(userRef.update({doctor: thisAuth.uid})));
	});

	test("Making the other user a doctor", async () => {
		// Setting up the test:
		await getAdminFirestore().collection("users").doc(otherAuth.uid).set(otherUserData);
		const userRef = getFirestore(thisAuth).collection("users").doc(otherAuth.uid);

		// Performing the test:
		expect(await firebase.assertFails(userRef.update({doctor: true})));
	});

});


describe("Being a secretary", () => {
	test("The current user is not a secretary", async () => {
		// Setting up the test:
		const db = getFirestore(thisAuth);
		const userRef = db.collection("users").doc(thisAuth.uid);
		
		await userRef.set(thisUserData);
		const userSnap = await userRef.get();

		// Performing the test:
		expect(userSnap.data().secretary).not.toBe(true);
	});

	test("The other user is not a secretary", async () => {
		// Setting up the test:
		await getAdminFirestore().collection("users").doc(otherAuth.uid).set(otherUserData);
		const userSnap = await getFirestore(thisAuth).collection("users").doc(otherAuth.uid).get();

		// Performing the test:
		expect(userSnap.data().secretary).not.toBe(true);
	});

	test("Making the current user a secretary", async () => {
		// Setting up the test:
		const db = getFirestore(thisAuth);
		const userRef = db.collection("users").doc(thisAuth.uid);

		userRef.set(thisUserData);

		// Performing the test:
		expect(await firebase.assertSucceeds(userRef.update({secretary: true})));
		expect(await firebase.assertFails(userRef.update({secretary: "true"})));
		expect(await firebase.assertFails(userRef.update({secretary: thisAuth.uid})));
	});

	test("Making the other user a secretary", async () => {
		// Setting up the test:
		await getAdminFirestore().collection("users").doc(otherAuth.uid).set(otherUserData);
		const userRef = getFirestore(thisAuth).collection("users").doc(otherAuth.uid);

		// Performing the test:
		expect(await firebase.assertFails(userRef.update({secretary: true})));
	});

});