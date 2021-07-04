const firebase = require('@firebase/testing');
const { projectId, thisAuth, thisClinicData, otherClinicData, getFirestore, getAdminFirestore } = require('./shared');

// Clear all the data before each test to make sure that each test happens in isolation:
beforeEach(() => {
	return firebase.clearFirestoreData({projectId: projectId});
});

// Clear all the data after the last test to make sure no crud is left over:
afterAll(() => {
	return firebase.clearFirestoreData({projectId: projectId});
});

describe("Clinic management", () => {
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


	test("Updating another user's clinic", async () => {
		// Setting up the test:
		const clinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;
		const clinicRef = await getFirestore(thisAuth).collection("clinics").doc(clinicID);

		// Performing the test:
		expect(await firebase.assertSucceeds(clinicRef.get()));
	});

	test("Reading the current user's clinic", async () => {
		// Setting up the test:
		const db = await getFirestore(thisAuth);
		const clinicRef = await db.collection("clinics").add(thisClinicData);

		// Performing the test:
		expect(await firebase.assertSucceeds(clinicRef.delete()));
	});


	test("Updating another user's clinic", async () => {
		// Setting up the test:
		const clinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;
		const clinicRef = await getFirestore(thisAuth).collection("clinics").doc(clinicID);

		// Performing the test:
		expect(await firebase.assertFails(clinicRef.delete()));
	});
});