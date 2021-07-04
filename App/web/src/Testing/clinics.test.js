const firebase = require('@firebase/testing');
const { projectId, thisAuth, thisClinicData, otherClinicData, getFirestore, getAdminFirestore, thisUserData, otherAuth, otherUserData } = require('./shared');

// Clear all the data before each test to make sure that each test happens in isolation:
beforeEach(() => {
	return firebase.clearFirestoreData({projectId: projectId});
});

// // Clear all the data after the last test to make sure no crud is left over:
// afterAll(() => {
// 	return firebase.clearFirestoreData({projectId: projectId});
// });

describe("Clinic CRUD", () => {
	test("Creating a clinic for the current user", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);

		// Performing the test:
		expect(await firebase.assertSucceeds(db.collection("clinics").add(thisClinicData)));
	});

	test("Creating a clinic for another user", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);

		// Performing the test:
		expect(await firebase.assertFails(db.collection("clinics").add(otherClinicData)));
	});

	test("Updating the current user's clinic", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);
		const clinicRef = await db.collection("clinics").add(thisClinicData);

		// Performing the test:
		expect(await firebase.assertSucceeds(clinicRef.update({
			name: otherClinicData.name,
			city: otherClinicData.city,
			address: otherClinicData.address
		})));

		expect(await firebase.assertFails(clinicRef.update({owner: otherClinicData.owner})));
	});

	test("Updating another user's clinic", async () => {
		// Setting up the test:
		const clinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;
		const clinicRef = await getFirestore(thisAuth).collection("clinics").doc(clinicID);

		// Performing the test:
		expect(await firebase.assertFails(clinicRef.update({
			name: thisClinicData.name,
			city: thisClinicData.city,
			address: thisClinicData.address
		})));

		expect(await firebase.assertFails(clinicRef.update({owner: thisClinicData.owner})));
	});

	test("Reading the current user's clinic", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);
		const clinicRef = await db.collection("clinics").add(thisClinicData);

		// Performing the test:
		expect(await firebase.assertSucceeds(clinicRef.get()));
	});


	test("Reading another user's clinic", async () => {
		// Setting up the test:
		const clinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;
		const clinicRef = await getFirestore(thisAuth).collection("clinics").doc(clinicID);

		// Performing the test:
		expect(await firebase.assertSucceeds(clinicRef.get()));
	});

	test("Deleting the current user's clinic", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);
		const clinicRef = await db.collection("clinics").add(thisClinicData);

		// Performing the test:
		expect(await firebase.assertSucceeds(clinicRef.delete()));
	});


	test("Deleting another user's clinic", async () => {
		// Setting up the test:
		const clinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;
		const clinicRef = await getFirestore(thisAuth).collection("clinics").doc(clinicID);

		// Performing the test:
		expect(await firebase.assertFails(clinicRef.delete()));
	});
});

describe("Doctor CRUD", () => {
	test("Adding a doctor to the current user's clinic", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);
		
		const thisUserRef = db.collection("users").doc(thisAuth.uid);
		await thisUserRef.set(thisUserData);
		await thisUserRef.update({doctor: true});

		const otherUserRef = getAdminFirestore().collection("users").doc(otherAuth.uid);
		otherUserRef.set(otherUserData);
		otherUserRef.update({doctor: true});

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

	test("Adding a regular user to the current user's clinic", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);
		
		const thisUserRef = db.collection("users").doc(thisAuth.uid);
		await thisUserRef.set(thisUserData);

		const otherUserRef = getAdminFirestore().collection("users").doc(otherAuth.uid);
		otherUserRef.set(otherUserData);

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

	test("Remove a doctor to the current user's clinic", async () => {
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
});