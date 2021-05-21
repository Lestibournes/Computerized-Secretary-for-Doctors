# About

Computerized Secretary for Private Doctors is aimed to provide online appointment management services to doctors who work privately and don't benefit from the systems used by large organizations.

# Set-up
## General
Install nodejs, npm, firebase tools, and git.

The project is currently using NodeJS 14.

Clone the repository into your preferred directory.

Navigate to the App/web folder within the repository.

Use:
```
npm install
```

To install package dependencies both in the App/web folder and in App/web/functions

## Tools Set-Up
### Ubuntu
In the terminal:

```
sudo snap install node
sudo apt install git curl
curl -sL firebase.tools | bash
```

### Mac OSX
#### Using Homebrew
Install homebrew from [Homebrew](brew.sh):

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then in the terminal:

```
brew install node@14
brew install git
curl -sL firebase.tools | bash
```

### Windows
Install [NodeJS](https://nodejs.org)

Install [Git](https://git-scm.com)

Install firebase-tools:

```
npm install -g firebase-tools
```

## Project Set-Up

In the terminal:

```
git clone https://github.com/Lestibournes/Computerized-Secretary-for-Doctors.git
cd "Computerized Secretary for Doctors/App/web"
npm install
cd functions
npm install
```

# Run
To run the app locally while in the App/web folder:

```
npm start
```

## Firebase Emulator
### Service Account Key
To use the Firebase emulator you will need a Service Account Key. This key is private and is not in the repository. To obtain this key please send a request here: [Email](s.y.schwarz@gmail.com)

The key file should be placed inside the project folder in:

```
App/web/Service Account Key/
```

### Functions Emulation
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
