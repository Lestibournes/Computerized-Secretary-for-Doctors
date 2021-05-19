# About

Computerized Secretary for Private Doctors is aimed to provide online appointment management services to doctors who work privately and don't benefit from the systems used by large organizations.

# Set-up
## General Instructions for all platforms
Install nodejs, npm, firebase tools, and git.

Clone the repository into your preferred directory.

Navigate to the App/web folder within the repository.

Use:
npm install

To install package dependencies both in the App/web folder and in App/web/functions

## Platform-Specific Instructions
### Ubuntu

To set up the project:

```
sudo snap install node
sudo apt install git curl
curl -sL firebase.tools | bash
git clone https://github.com/Lestibournes/Computerized-Secretary-for-Doctors.git
cd "Computerized Secretary for Doctors/App/web"
npm install
cd functions
npm install
```

# Run
While in App/web:

To run the app:
```
npm start
```

To start the firebase functions emulation:
```
firebase emulators:start --only functions
```

To use the functions emulator, make sure that src/init.js includes the following line (uncommented):
```
fn.useEmulator("localhost", 5001);
```

Comment out that line in order to use the functions directly on the production server.

# Deploy
To deploy the web app to the server run the following command while in App/web:

```
npm run build && firebase deploy
```
