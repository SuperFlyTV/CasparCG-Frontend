# CasparCG FrontEnd Application

## Setting Up For Development

1. Clone the project and open a command prompt in the root directory of the project.
2. Run `npm install`
3. Multiple Launch Options:
   1. If you have [Foreman](https://www.npmjs.com/package/foreman) installed globally, you can simply run `npm start`. This will compile the TypeScript and launch the React / Electron.
   2. If you do not, run `npm run-script start-react` then once React is running, run `npm run-script build-server` and finally once the TS is compiled run `npm run-script electron-react-start`.