const firebase = require('@firebase/testing');
const { projectId, thisAuth, thisClinicData, otherClinicData, getFirestore, getAdminFirestore, thisUserData, otherAuth, otherUserData, thisTypesData, otherTypesData } = require('./shared');

async function popuplateTypesDatabase() {
	// Create the clinic:
	const thisClinicID = (await getAdminFirestore().collection("clinics").add(thisClinicData)).id;
	const otherClinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;

	// Setting up this doctor with his shifts in both clinics:
	const thisUserRef = getAdminFirestore().collection("users").doc(thisAuth.uid);
	await thisUserRef.set(thisUserData);
	await thisUserRef.update({doctor: true});

	await getAdminFirestore().collection("clinics").doc(thisClinicID).collection("doctors").doc(thisAuth.uid).set({
		user: thisAuth.uid,
		clinic: thisClinicID,
		minimum: 15
	});

	await getAdminFirestore().collection("clinics").doc(otherClinicID).collection("doctors").doc(thisAuth.uid).set({
		user: thisAuth.uid,
		clinic: otherClinicID,
		minimum: 15
	});

	const thisTypesRef1 = getAdminFirestore().collection("clinics").doc(thisClinicID).collection("doctors").doc(thisAuth.uid).collection("types");
	const thisTypesRef2 = getAdminFirestore().collection("clinics").doc(otherClinicID).collection("doctors").doc(thisAuth.uid).collection("types");

	for (const TypeData of thisTypesData) {
		thisTypesRef1.add(TypeData);
		thisTypesRef2.add(TypeData);
	}

	for (const typeData of otherTypesData) {
		thisTypesRef1.add(typeData);
		thisTypesRef2.add(typeData);
	}

	// Setting up the doctor with his shifts in both clinics:
	const otherUserRef = getAdminFirestore().collection("users").doc(otherAuth.uid);
	await otherUserRef.set(otherUserData);
	await otherUserRef.update({doctor: true});

	await getAdminFirestore().collection("clinics").doc(thisClinicID).collection("doctors").doc(otherAuth.uid).set({
		user: otherAuth.uid,
		clinic: thisClinicID,
		minimum: 15
	});

	await getAdminFirestore().collection("clinics").doc(otherClinicID).collection("doctors").doc(otherAuth.uid).set({
		user: otherAuth.uid,
		clinic: otherClinicID,
		minimum: 15
	});

	const otherTypesRef1 = getAdminFirestore().collection("clinics").doc(thisClinicID).collection("doctors").doc(otherAuth.uid).collection("types");
	const otherTypesRef2 = getAdminFirestore().collection("clinics").doc(otherClinicID).collection("doctors").doc(otherAuth.uid).collection("types");

	for (const typeData of thisTypesData) {
		otherTypesRef1.add(typeData);
		otherTypesRef2.add(typeData);
	}

	for (const typeData of otherTypesData) {
		otherTypesRef1.add(typeData);
		otherTypesRef2.add(typeData);
	}
}

// Clear all the data before each test to make sure that each test happens in isolation:
beforeEach(() => {
	return firebase.clearFirestoreData({projectId: projectId});
});

// Clear all the data after the last test to make sure no crud is left over:
// afterAll(() => {
// 	return firebase.clearFirestoreData({projectId: projectId});
// });

describe("Creating types", () => {
	test("Create type in the current user's clinic", async () => {
		// Setting up the test:

		// Create the clinic:
		const clinicRef = await getFirestore(thisAuth).collection("clinics").add(thisClinicData);
		
		// Setting up this doctor:
		const thisUserRef = getFirestore(thisAuth).collection("users").doc(thisAuth.uid);
		await thisUserRef.set(thisUserData);
		await thisUserRef.update({doctor: true});

		await clinicRef.collection("doctors").doc(thisAuth.uid).set({
			user: thisAuth.uid,
			clinic: clinicRef.id,
			minimum: 15
		});

		const thisTypesRef = clinicRef.collection("doctors").doc(thisAuth.uid).collection("types");

		// Setting up the other doctor:
		const otherUserRef = getAdminFirestore().collection("users").doc(otherAuth.uid);
		await otherUserRef.set(otherUserData);
		await otherUserRef.update({doctor: true});

		await clinicRef.collection("doctors").doc(otherAuth.uid).set({
			user: otherAuth.uid,
			clinic: clinicRef.id,
			minimum: 15
		});

		const otherTypesRef = clinicRef.collection("doctors").doc(otherAuth.uid).collection("types");
	
		// Performing the test:
		for (const typeData of thisTypesData) {
			expect(await firebase.assertSucceeds(thisTypesRef.add(typeData)));
			expect(await firebase.assertSucceeds(otherTypesRef.add(typeData)));
		}

		for (const typeData of otherTypesData) {
			expect(await firebase.assertSucceeds(thisTypesRef.add(typeData)));
			expect(await firebase.assertSucceeds(otherTypesRef.add(typeData)));
		}
	})

	test("Create a type for another doctor in another user's clinic", async () => {
		// Setting up the test:

		// Set up the clinic:
		const clinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;

		// Set up the doctor:
		await getAdminFirestore().collection("users").doc(otherAuth.uid).set(otherUserData);
		await getAdminFirestore().collection("users").doc(otherAuth.uid).update({doctor: true});

		await getAdminFirestore().collection("clinics").doc(clinicID).collection("doctors").doc(otherAuth.uid).set({
			user: otherAuth.uid,
			clinic: clinicID,
			minimum: 15
		});

		// Get a reference to the other doctor's type as the current user:
		const typesRef = getFirestore(thisAuth).collection("clinics").doc(clinicID).collection("doctors").doc(otherAuth.uid).collection("types");
	
		// Performing the test:
		for (const typeData of thisTypesData) {
			expect(await firebase.assertFails(typesRef.add(typeData)));
		}

		for (const typeData of otherTypesData) {
			expect(await firebase.assertFails(typesRef.add(typeData)));
		}
	})

	test("Create a type for the current user in another user's clinic", async () => {
		// Setting up the test:

		// Create the clinic:
		const clinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;
	
		// Setting up the doctor:
		const thisUserRef = getAdminFirestore().collection("users").doc(thisAuth.uid);
		await thisUserRef.set(thisUserData);
		await thisUserRef.update({doctor: true});

		await getAdminFirestore().collection("clinics").doc(clinicID).collection("doctors").doc(thisAuth.uid).set({
			user: thisAuth.uid,
			clinic: clinicID,
			minimum: 15
		});

		const thisTypesRef = getFirestore(thisAuth).collection("clinics").doc(clinicID).collection("doctors").doc(thisAuth.uid).collection("types");
	
		// Performing the test:
		for (const typeData of thisTypesData) {
			expect(await firebase.assertSucceeds(thisTypesRef.add(typeData)));
		}

		for (const typeData of otherTypesData) {
			expect(await firebase.assertSucceeds(thisTypesRef.add(typeData)));
		}
	});
});

describe("Reading, updating, and deleting types", () => {
	beforeEach(async () => {
		await popuplateTypesDatabase();
	});
	
	test("Read all the types", async () => {
		// Fetch all the types of all the doctors in all the clinics:
		const clinicSnaps = await getFirestore(thisAuth).collection("clinics").get();

		for (const clinicSnap of clinicSnaps.docs) {
			const doctorSnaps = await clinicSnap.ref.collection("doctors").get();

			for (const doctorSnap of doctorSnaps.docs) {
				expect(await firebase.assertSucceeds(doctorSnap.ref.collection("types").get()));
			}
		}
	});

	test("Update types", async () => {
		// Fetch all the types of all the doctors in all the clinics:
		const clinicSnaps = await getFirestore(thisAuth).collection("clinics").get();

		for (const clinicSnap of clinicSnaps.docs) {
			const doctorSnaps = await clinicSnap.ref.collection("doctors").get();

			for (const doctorSnap of doctorSnaps.docs) {
				const typeSnaps = await doctorSnap.ref.collection("types").get();

				for (const typeSnap of typeSnaps.docs) {
					if (clinicSnap.data().owner === thisAuth.uid || doctorSnap.id === thisAuth.uid) {
						expect(await firebase.assertSucceeds(typeSnap.ref.update({
							name: "Zooloo",
							duration: 1000
						})));
					}
					else {
						expect(await firebase.assertFails(typeSnap.ref.update({
							name: "Zooloo",
							duration: 1000
						})));
					}
				}
			}
		}
	});

	test("Delete types", async () => {
		// Fetch all the types of all the doctors in all the clinics:
		const clinicSnaps = await getFirestore(thisAuth).collection("clinics").get();

		for (const clinicSnap of clinicSnaps.docs) {
			const doctorSnaps = await clinicSnap.ref.collection("doctors").get();

			for (const doctorSnap of doctorSnaps.docs) {
				const typeSnaps = await doctorSnap.ref.collection("types").get();

				for (const typeSnap of typeSnaps.docs) {
					if (clinicSnap.data().owner === thisAuth.uid || doctorSnap.id === thisAuth.uid) {
						expect(await firebase.assertSucceeds(typeSnap.ref.delete()));
					}
					else {
						expect(await firebase.assertFails(typeSnap.ref.delete()));
					}
				}
			}
		}
	});
});