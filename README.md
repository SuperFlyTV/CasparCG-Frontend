# CasparCG Frontend Manager

A server manager for CasparCG that runs on electron for easy windows installation and usage!

## Build Electron App Yourself

Thankfully, building an electron app from scratch is really easy!

1. Install [NodeJS](https://nodejs.org/en/).
2. Clone the [dev branch of the GitHub repo](https://github.com/chrisryanouellette/CasparCG_Electron_FrontEnd/tree/dev).
3. Open a command prompt in the downloaded folder.
4. Confirm the `.env` file exists and has `ENV` set to `PRODUCTION`.
5. Run `npm install`.
6. Run `npm start-script build`
7. The `.exe` file should now be in `builds/casparcg-configuration-electron-[Computer Architecture]/`

## Application Setup

Once the application is installed and running. All you need to to is follow the prompts on the message board to add the path to your `casparcg.exe` file and choose the correct server version. Don't forget to save with the save icon!

## Features

- Create and manage multiple CasparCG configuration files without writing a line of XML!
- Start and stop the CasparCG server
- View logs from the server without the extra clutter
- View Caspar's initialize / setup logs at any time

### Other Information

Want to find more CasparCG products? Please consider joining the [CasparCG Forum](https://casparcgforum.org/). There are a ton of amazing projects and people on their ready and willing to help.