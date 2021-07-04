const firebase = require('@firebase/testing');
const { projectId, thisAuth, thisClinicData, otherClinicData, getFirestore, getAdminFirestore, thisUserData, otherAuth, otherUserData } = require('./shared');

// Clear all the data before each test to make sure that each test happens in isolation:
beforeEach(() => {
	return firebase.clearFirestoreData({projectId: projectId});
});

// Clear all the data after the last test to make sure no crud is left over:
afterAll(() => {
	return firebase.clearFirestoreData({projectId: projectId});
});

describe("Doctor CRUD", () => {
	test("Adding a doctor to the current user's clinic", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);
		
		// Set up 2 doctor users:
		const thisUserRef = db.collection("users").doc(thisAuth.uid);
		await thisUserRef.set(thisUserData);
		await thisUserRef.update({doctor: true});

		const otherUserRef = getAdminFirestore().collection("users").doc(otherAuth.uid);
		otherUserRef.set(otherUserData);
		otherUserRef.update({doctor: true});

		// Set up the clinic:
		const clinicRef = await db.collection("clinics").add(thisClinicData);

		// Performing the test:
		// Valid attempts:
		expect(await firebase.assertSucceeds(clinicRef.collection("doctors").doc(thisAuth.uid).set({
			user: thisAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		})));

		expect(await firebase.assertSucceeds(clinicRef.collection("doctors").doc(otherAuth.uid).set({
			user: otherAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		})));
		
		// User id mismatch:
		expect(await firebase.assertFails(clinicRef.collection("doctors").doc(thisAuth.uid).set({
			user: otherAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		})));

		expect(await firebase.assertFails(clinicRef.collection("doctors").doc(otherAuth.uid).set({
			user: thisAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		})));

		// Clinic id mismatch:
		expect(await firebase.assertFails(clinicRef.collection("doctors").doc(thisAuth.uid).set({
			user: thisAuth.uid,
			clinic: "clinicRef.id",
			minimum: 10
		})));

		expect(await firebase.assertFails(clinicRef.collection("doctors").doc(otherAuth.uid).set({
			user: otherAuth.uid,
			clinic: "clinicRef.id",
			minimum: 10
		})));
	});

	test("Adding a doctor to another user's clinic", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);
		
		// Set up 2 doctor users:
		const thisUserRef = db.collection("users").doc(thisAuth.uid);
		await thisUserRef.set(thisUserData);
		await thisUserRef.update({doctor: true});

		const otherUserRef = getAdminFirestore().collection("users").doc(otherAuth.uid);
		otherUserRef.set(otherUserData);
		otherUserRef.update({doctor: true});

		// Set up the clinic:
		const clinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;
		const clinicRef = await db.collection("clinics").doc(clinicID);

		// Performing the test:
		// Attempts that would be valid on the user's own clinic:
		expect(await firebase.assertFails(clinicRef.collection("doctors").doc(thisAuth.uid).set({
			user: thisAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		})));

		expect(await firebase.assertFails(clinicRef.collection("doctors").doc(otherAuth.uid).set({
			user: otherAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		})));
	});

	test("Adding a regular user to the current user's clinic", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);
		
		// Set up 2 regular users:
		const thisUserRef = db.collection("users").doc(thisAuth.uid);
		await thisUserRef.set(thisUserData);

		const otherUserRef = getAdminFirestore().collection("users").doc(otherAuth.uid);
		otherUserRef.set(otherUserData);

		// Set up the clinic:
		const clinicRef = await db.collection("clinics").add(thisClinicData);

		// Performing the test:
		// It should only be possible to add someone as a doctor if he is marked as a doctor:
		expect(await firebase.assertFails(clinicRef.collection("doctors").doc(thisAuth.uid).set({
			user: thisAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		})));

		expect(await firebase.assertFails(clinicRef.collection("doctors").doc(otherAuth.uid).set({
			user: otherAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		})));
	});

	test("Adding a regular user to another user's clinic", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);
		
		// Set up 2 regular users:
		const thisUserRef = db.collection("users").doc(thisAuth.uid);
		await thisUserRef.set(thisUserData);

		const otherUserRef = getAdminFirestore().collection("users").doc(otherAuth.uid);
		otherUserRef.set(otherUserData);

		// Set up the clinic:
		const clinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;
		const clinicRef = await db.collection("clinics").doc(clinicID);

		// Performing the test:
		// It should only be possible to add someone as a doctor if he is marked as a doctor:
		expect(await firebase.assertFails(clinicRef.collection("doctors").doc(thisAuth.uid).set({
			user: thisAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		})));

		expect(await firebase.assertFails(clinicRef.collection("doctors").doc(otherAuth.uid).set({
			user: otherAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		})));
	});

	test("Remove a doctor from the current user's clinic", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);
		
		const thisUserRef = db.collection("users").doc(thisAuth.uid);
		await thisUserRef.set(thisUserData);
		await thisUserRef.update({doctor: true});
		
		const otherUserRef = getAdminFirestore().collection("users").doc(otherAuth.uid);
		await otherUserRef.set(otherUserData);
		await otherUserRef.update({doctor: true});
		
		const clinicRef = await db.collection("clinics").add(thisClinicData);

		const thisDoctorRef = clinicRef.collection("doctors").doc(thisAuth.uid);
		const otherDoctorRef = clinicRef.collection("doctors").doc(otherAuth.uid);

		await thisDoctorRef.set({
			user: thisAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		});

		await otherDoctorRef.set({
			user: otherAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		})
		
		// Performing the test:
		// Valid attempts:
		expect(await firebase.assertSucceeds(thisDoctorRef.delete()));
		expect(await firebase.assertSucceeds(otherDoctorRef.delete()));
	});

	test("Remove a doctor from another user's clinic", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);
		
		// Set up 2 doctor users:
		const thisUserRef = db.collection("users").doc(thisAuth.uid);
		await thisUserRef.set(thisUserData);
		await thisUserRef.update({doctor: true});
		
		const otherUserRef = getAdminFirestore().collection("users").doc(otherAuth.uid);
		await otherUserRef.set(otherUserData);
		await otherUserRef.update({doctor: true});
		
		// Set up the clinic:
		const adminClinicRef = await getAdminFirestore().collection("clinics").add(otherClinicData);
		const clinicRef = await db.collection("clinics").doc(adminClinicRef.id);

		// Add the doctors:
		await adminClinicRef.collection("doctors").doc(thisAuth.uid).set({
			user: thisAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		});

		await adminClinicRef.collection("doctors").doc(otherAuth.uid).set({
			user: otherAuth.uid,
			clinic: clinicRef.id,
			minimum: 10
		});
		
		// Performing the test:
		expect(await firebase.assertSucceeds(clinicRef.collection("doctors").doc(thisAuth.uid).delete()));
		expect(await firebase.assertFails(clinicRef.collection("doctors").doc(otherAuth.uid).delete()));
	});
});