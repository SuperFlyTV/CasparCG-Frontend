# Project Structure & Layout 

The project is broken up into two sections, the client and the server. The server is Electron's main process while the client is a React app that interacts with Electron's renderer process. </br>

The `build-scrips` folder contains all the scripts used when converting the TypeScript to JS and when packaging the application. 

## Server Files

- `src/server/main.ts` - The application main file which is used to start and manage electron
- `src/server/.env` - The environment file for the NodeJS instance. This controls how the app loads as well as a few other settings
- `/src/server/module/` - All the modules for the NodeJS instance.

## Client Files

- `/src/client/index.tsx` - The script that loads in the remaining React app.
- `src/client/components/App.tsx` - The main script for the React App.
- `src/client/scss/` - All the styles for the React app.