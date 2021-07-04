# References
## Official Documentation

https://firebase.google.com/docs/rules/unit-tests

## Tutorial from Firebase

(uses Mocha instead of Jest, but it's just as relevant)

https://www.youtube.com/watch?v=VDulvfBpzZE

## Tutorial from Fireship

(uses an older version of firebase tools, but still has some relevant info)

https://www.youtube.com/watch?v=Rx4pVS1vPGY

# Setup
1. Installing these should be covered by `npm install` when setting up the project, but if not then:

	- If not in a react project (react sets up it's own Jest environment by default), use:

		`npm install --save-dev jest`

	- Install Firebase testing api:

		`npm install --save-dev @firebase/testing`

2. Some versions of Jest have a bug when testing firebase.
I used this workaround to get it working: https://github.com/dconeybe/FirebaseJsBug3096/tree/workaround
If the tests don't work and you get an internal error from Firebase, use the above workaround. In that case add:

	`"jest": "jest"`

	to the "scripts" section of package.json and run the tests using:

	`npm run jest`

	since by default `npm run test` will no longer work with the react-provided Jest setup. This step is by default a part of the project's git.

3. When running the tests you must first run the emulators in the background. You can run all the emulators that are already set up using:

	`firebase emulators:start`

	from inside the project directory.

# Problems
Even with the workaround Jest still somtimes reports a tests failure on `firebase.assertFails()` when firebase does indeed correctly reject the query.
Firebase is correctly returning an error but Jest is interpreting that error as a failure of the test instead of as correct behavior that matches the test conditions.
What is even stranger is that bugs with the testing framework only appear on some runs and not others.
However, running just the one test suit and sometimes using `.only` on the problematic test causes the problem to not appear. This is strange since the Firestore database is the only thing that is being operated on, and it is cleared before each test.

Perhaps it would be better to try a different testing framework, such as Mocha, which is used in one of the above tutorials.