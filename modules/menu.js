'use strict';

/*
    Electron Menu Creation Modules
*/

const {Menu} = require('electron');

// Creates the electron apps menu bar
function createApplicationMenu() {
    const menuTabs = [];
    menuTabs.push({
        label: 'File',
        submenu: [
            { role: 'close' }
        ]
    }, {
        label: 'View',
        submenu: [
          { role: 'resetzoom' },
          { role: 'zoomin' },
          { role: 'zoomout' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
          
        ]
      });
      if(process.env.ENV === 'DEVELOPMENT') {
          menuTabs.push({
              label: 'Development',
              submenu: [
                { role: 'reload' },
                { role: 'forcereload' },
                { role: 'toggledevtools' },
                {label: 'Quit & Relaunch', click() {
                    app.quit();
                    app.relaunch();
                }}
              ]
          });
      }
    const menu = Menu.buildFromTemplate(menuTabs);
    Menu.setApplicationMenu(menu);
}

module.exports = createApplicationMenu;