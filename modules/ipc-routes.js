'use string';


/*
    IPC Main routes.
    Express equivelant is the routes folder
*/

const _path = require('path'),
    _fs = require('fs');

// Helper Imports
const getLocalFile = require('./helpers/fs_helpers').getLocalFile;
const checkLocalFile = require('./helpers/fs_helpers').checkLocalFile;
const createLocalFile = require('./helpers/fs_helpers').createLocalFile;
const removeLocalFile = require('./helpers/fs_helpers').removeLocalFile;
const launchCasparCGServer = require('./casparcg').launchCasparCGServer;
const endCasparCGServer = require('./casparcg').endCasparCGServer;
const findConfigurationFile = require('./casparcg').findConfigurationFile;

/*
    Route Functions
*/
// Attepts to get a file called app.config.json in the tmp folder
// If it fails, it creates the file
// @return {Promise} - A promise that resolves if the file is found
function requestAppConfig() {
    const path = _path.join(process.env.location, '/src/tmp');
    return checkLocalFile(path + '/app.config.json')
    .then(() => getLocalFile(path + '/app.config.json'))
    // If not found, create a new file
    .catch(checkLocalFile(path, true)).catch(() => {
        createLocalFile(JSON.stringify({}), 'app.config.json', path);
        throw new Error('No config');
    });
}

// Attempts to save the applications configuration
// -- About this function: I want to replace it with a 
// -- more generic "Add data to config" function
// @param {object} data - The data to be saved
// @returns {Promise} - A promise that resolves if the data is saved successfully
function saveAppConfig(data) {
    return new Promise((resolve, reject) => {
        const path = _path.join(process.env.location, '/src/tmp');
        const minRequiredData = [
            'casparcg-file-path',
            'casparcg-server-version'
        ];
        minRequiredData.forEach(item => data[item] !== undefined);
        data['casparcg-file-path'] = _path.normalize(data['casparcg-file-path']);
        checkLocalFile(path, true)
        .then(createLocalFile(JSON.stringify(data, null, 4), 'app.config.json', path))
        .then(resolve).catch(error => {
            error = error.message ? error.message : error;
            return reject(error);
        });
    });
}

// Attepts to get a .json file containing all the 
// config info for a server version
// @param {string || string[]} - A string or array of strings to get the version for
// @returns {Promise} - A promise that esovles with the version files requested
const requestServerVersion = (version) => {
    return new Promise((resolve, reject) => {
        // If the version param is an array, get all files
        if((typeof version.map) !== 'undefined') {
            const versions = [];
            Promise.all(version.map(item => {
                return getLocalFile(_path.join(process.env.location, '/src/json/versions/', version + '.json'))
                .then(res => {
                    res = JSON.parse(res);
                    versions.push(res);
                    return true;
                });
            })).then(() => resolve(versions)).catch(error => {
                return reject(error);
            });
        } else {
            getLocalFile(_path.join(process.env.location, '/src/json/versions/', version + '.json'))
            .then(res => {
                res = JSON.parse(res);
                return resolve(res);
            }).catch(error => {
                return reject(error);
            });
        }
    });
}

// Saves a configuration file to the local file system
// @param {object} - An object containing the message and data required
// @retuns {Promise} - A promise that resolves if the config is saved successfuly.
const saveConfigurationData = (message) => {
    return new Promise((resolve, reject) => {
        if(!message.version) throw new Error('Missing configuration version');
        const path = _path.join(process.env.location, '/src/tmp/saves/', message.version);
        message.data = JSON.stringify(message.data, null, 4);
        if(!message.fileName.includes('.json')) message.fileName += '.json';
        checkLocalFile(path, true)
        .then(() => createLocalFile(message.data, message.fileName , path))
        .then(resolve).catch(error => {
            error = error.message ? error.message : error;
            return reject(error);
        });
    }); 
}

// All the routes for the IPC main process
// @param {object} ipc - The IPC main process to add the routes to
const defineIpcRoutes = (ipc) => {
    ipc.on('request-app-config', (event, args) => {
        requestAppConfig().then(res => {
            res = JSON.parse(res);
            event.reply('reply-app-config', res);
        }).catch(error => {
            event.reply('reply-app-config', {message: error.message, error: true});
            console.error(error);
        });
    });

    ipc.on('request-save-app-config', (event, args) => {
        saveAppConfig(args).then(() => {
            event.reply('reply-save-app-config', {message: 'Successful save app data'});
        }).catch(error => {
            event.reply('reply-save-app-config', {message: error.message, error: true});
            console.error(error);
        });
    })

    ipc.on('request-server-versions', (event, args) => {
        requestServerVersion(args).then(result => {
            event.reply('reply-server-versions', result);
        }).catch(error => {
            event.reply('reply-server-versions', {message: 'Error: ' + error, error: true});
            console.error(error);
        });
    });

    ipc.on('request-version-saves', (event, args) => {
        const path = _path.join(process.env.location, '/src/tmp/saves/', args.version);
        checkLocalFile(path).then(() => {
            _fs.readdir(path, 'utf8', (error, files) => {
                if(error) throw new Error(error.message);
                event.reply('reply-version-saves', files);
            });
        }).catch(error => {
            event.reply('reply-version-saves', {message: 'Error: ' + error, error: true});
            console.error(error);
        });
    });

    ipc.on('request-load-save-file', (event, args) => {
        getLocalFile(_path.join(process.env.location, '/src/tmp/saves/', args.version, args.name))
        .then(res => {
            res = JSON.parse(res);
            event.reply('reply-load-save-file', res);
        }).catch(error => {
            event.reply('reply-load-save-file', {message: 'Error: ' + error, error: true});
            console.error(error);
        });
    });

    ipc.on('request-save-configuration-data', (event, args) => {
        saveConfigurationData(args).then(res => {
            if(res) throw new Error(res);
            event.reply('reply-save-configuration-data', {message: args.fileName});
        }).catch(error => {
            event.reply('reply-save-configuration-data', {message: 'Error: ' + error, error: true});
            console.error(error);
        });
    });

    ipc.on('request-delete-config', (event, args) => {
        const path = _path.join(process.env.location, '/src/tmp/saves/', args.version, args.fileName);
        removeLocalFile(path).then(res => {
            if(res) throw new Error(res);
            event.reply('reply-remove-success', {message: `Data '${args.fileName}' removed successfully`});
        }).catch(error => {
            event.reply('request-delete-config', {message: 'Error: ' + error, error: true});
            console.error(error);
        });
    });

    ipc.on('request-connect-caspar', (event, args) => {
        if(!args.path) {
            event.reply('reply-connect-casparcg', {message: 'Error: Missing casparcg server path', error: true});
            return;
        }
        launchCasparCGServer(args.path, event).then(() => {
            event.reply('reply-connect-caspar', {message: 'Successfull connection'});
            return;
        }).catch(error => {
            event.reply('reply-connect-caspar', {message: error, error: true});
            console.error(error);
        });
    });

    ipc.on('request-update-caspar-config', (event, args) => {
        if(!args.fileName) return event.reply('reply-update-caspar-config', {message: 'missing filename', error: true});
        if(args.data && typeof args.data === 'string') {
            findConfigurationFile(args.path).then(async ({configs, path}) => {
                if(configs.length < 2) {
                    if(!configs.length) return path;
                    if(args.overwrite) {
                        await removeLocalFile(_path.join(path, 'casparcg.config'));
                        return path;
                    } else {
                        throw new Error('Confirm overrite configuration file');
                    }
                }
                throw new Error('Multiple configuration files');
            }).then(path => createLocalFile(args.data, 'casparcg.config', path))
            .then(() => {
                event.reply('reply-update-caspar-config', {message: 'Successful server configuration update'});
            }).catch(error => {
                event.reply('reply-update-caspar-config', {message: 'Error: ' + error, error: true});
                console.error(error);
            });
        } else {
            event.reply('reply-update-caspar-config', {message: 'Invalid data', error: true});
        }
    });

    ipc.on('request-disconnect-caspar', (event, args) => {
        endCasparCGServer(args.pid).then(() => {
            event.reply('reply-disconnect-caspar', {message: 'Disconnection connection'});
            return;
        }).catch(error => {
            event.reply('reply-disconnect-casparcg', {message: 'Error: ' + error, error: true});
            console.error(error);
        });
    });
}

module.exports = defineIpcRoutes;