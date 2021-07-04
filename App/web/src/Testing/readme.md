# References
Relevant documentation for tesing Firestore Security Rules:
https://firebase.google.com/docs/rules/unit-tests

https://www.youtube.com/watch?v=VDulvfBpzZE (uses Mocha instead of JEST, but it's just as relevant)
https://www.youtube.com/watch?v=Rx4pVS1vPGY (uses and older version of firebase tools, but still has some relevant info)

# Setup
1. Installing these should be covered by `npm install` when setting up the project, but if not then:

	- If not in a react project (react sets up it's own jest environment by default), use:

		`npm install --save-dev jest`

	- Install Firebase testing api:

		`npm install --save-dev @firebase/testing`

2. Some versions of JEST have a bug when testing firebase.
I used this workaround to get it working: https://github.com/dconeybe/FirebaseJsBug3096/tree/workaround
If the tests don't work and you get an internal error from Firebase, use the above workaround. In that case add:

	`"jest": "jest"`

	to the "scripts" section of package.json and run the tests using:

	`npm run jest`

	since by default `npm run test` will no longer work with the react-provided jest setup.
	This step is by default a part of the project's git.

3. When running the tests you must first run the emulators in the background. You can run all the emulators that are already set up using:

	`firebase emulators:start`

	from inside the project directory.