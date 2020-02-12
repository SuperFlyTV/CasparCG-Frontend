# CasparCG FrontEnd Application

The application is designed to make interacting with the CasparCG server more straight forward by providing a GUI with configuration and console options.

## Packaging the Application for Production

1. Ensure you have installed all the dependencies by running `npm install`.
2. If you plan on moving the packaged application folder to a subdirectory of your `casparcg.exe` file, then ensure that `CASPARCG_EXE_PATH` is commented out with a `#` in the `.env` file. If not, `CASPARCG_EXE_PATH` should equal the path to the folder containing your `casaprcg.exe` file.
3. Run `npm run-script package`

The console will provide green messages for successful operations and red for failed operations. </br>

The packaged application will be in the root directory inside the `build` folder.

## Setting Up For Development

1. Clone the project and open a command prompt in the root directory of the project.
2. Run `npm install`
3. If you do not need any debugging, run `npm start` to begin developing.


To develop the application with NodeJS debugging, you must run the React and NodeJS instances separately. The following two commands do not copy any non-typescript files so it is recommended to use `npm start` at least once.

1. Run `npm run-script start-react`. This starts the React Dev Server.
2. Then use VSCode to run the `Debug Main Process` task. (In the debug tab).

### The .env file

Below is a breakdown of all the `.env` variables within the application. The `.env` file controls how the application loads and what files are used when serving windows. You can find the `.env` file in `src/server/.env`.

| Variable | Definition |
|---|---|
| ENV | Required - The environment to run the app in. `DEVELOPMENT` or `PROD` |
| REACT_URL | Required for Development - The URL used to load the React front end |
| REACT_DEV_EXTENSION | Optional - Where the React Dev Tools Extension is located |
| CASPARCG_EXE_PATH | Optional - Value to be used if the application folder is not in a subdirectory of the `casaprcg.exe` file |

## Known Development Bugs

If you are using React Dev Tools Extension within the electron application, then you may experience an Electron bug where `app.on('ready')` will never fire. To fix this do the following.

1. Navigate to `%AppData%/Electron/`.
2. Then open `DevTools Extensions`
3. Remove all the items within the array. This will force electron to reinstall all the extensions.
4. Re-build and run the application. It should launch normally.