'use strict';

// Main application variable
const _app = (function() {
    // Communicatin between Main and Render Process
    const ipc = require('electron').ipcRenderer;

    // App Enviorment variables
    const env= {
        appConfig: {},
        loadedScript: null,
        casparStatus: {
            connected: false,
            currentConfig: null
        }
    };

    // App initialzation
    (function() {
        const nav = document.querySelectorAll('nav a'), 
            connectToCaspar = document.querySelector('header button.connect-to-caspar');
        // Attach page transition function
        nav.forEach(n => n.addEventListener('click', handleChangePage));
        connectToCaspar.addEventListener('click', handleConnectCaspar);
        connectToCaspar.prepend(createSvgIcon('caspar'));
        // Request app configuration 
        ipc.send('request-app-config');
        ipc.once('reply-app-config', (event, message) => {
            if(message.error) {
                if(message.message !== 'No Config') {
                    // Temporary setup instructions
                    displayMessage([
                        {
                            message: 'Please navigate to the setup page.'
                        }, {
                            message: 'Then add the File Path and Server Version\n'
                        }, {
                            message: 'Finally save the file with the save icon', type: 'warn'
                        }
                    ]);
                } else {
                    displayMessage({
                        message: 'Error getting app configuration. ' + message.message,
                        type: 'error'
                    });
                }
            } else {
                env.appConfig = message;
            }
            // Load all needed scripts
            initializeScripts();
        });
    })();

    // Creates and attaches the apps script tags to the DOM
    function initializeScripts() {
        const body = document.querySelector('body'),
            setup = document.createElement('script'),
            config = document.createElement('script'),
            log = document.createElement('script');

        
        setup.src = '../js/setup.js';
        config.src = '../js/configurator.js';
        log.src = '../js/log.js';
        log.async = true; log.defer = true;
        
        // If there was an excisting config, load the configuration file
        if(env.appConfig && Object.keys(env.appConfig).length) {
            env.loadedScript = '_configuration';
            config.onload = () => _configuration.initialize();
            setup.async = true; setup.defer = true;
            document.querySelector('nav .config').classList.add('active');
        // else, load the setup file
        } else {
            env.loadedScript = '_setup';
            setup.onload = () => _setup.initialize();
            config.async = true; config.defer = true;
            document.querySelector('nav .setup').classList.add('active');
        }
        body.append(setup, config, log);
    }

    // Attempts to luanch the casparcg server
    // @retuns {Promise} - A Promse that resolves if the server is launched correctly
    function connectToCaspar() {
        return new Promise((resolve, reject) => {
            ipc.send('request-connect-caspar', {path: env.appConfig['casparcg-file-path']});
            ipc.once('reply-connect-caspar', (event, data) => {
                const p = document.querySelector('header button.connect-to-caspar p');
                if(data.error) {
                    if(!isNaN(data.message)) {
                        displayMessage({
                            message: 'Caspar is running on PID ' + data.message,
                            type: 'warn'
                        });
                        return reject();
                    }
                    return reject(data.message);
                }
                _logs.restartLogger();
                env.casparStatus.connected = 'pending';
                p.textContent = 'Launching CasparCG Server';
                return resolve();
            });
        });
    }

    // Updates the apps status of the casparcg server
    // @param {boolean} status - The status to be updated to
    function forceCasparStatusUpdate(status) {
        const p = document.querySelector('header button.connect-to-caspar p');
        if(status === true) {
            env.casparStatus.connected = true;
            p.textContent = 'Disconnect CasparCG Server';
        } else if(status === false) {
            env.casparStatus.connected = false;
        } else {
            throw new Error('Invalid status');
        }
    }

    // Attempts to quit the casparcg server
    // @param {number} pid - The CasparCG server's pid
    // @returns {Promise} - A promise that resolves of the server is killed successfully
    function disconnectFromCaspar(pid) {
        return new Promise((resolve, reject) => {
            ipc.send('request-disconnect-caspar', {pid});
            ipc.once('reply-disconnect-caspar', (event, data) => {
                const p = document.querySelector('header button.connect-to-caspar p');
                if(data.error) {
                    displayMessage({message: message.data, type: 'error'});
                    return;
                }
                env.casparStatus.connected = false;
                p.textContent = 'Launch CasparCG Server';
                return resolve();
            });
        });
    }

    // Event listener to start / stop the CasparCG server
    // @param {object} event - The event object
    function handleConnectCaspar(event) {
        if(env.appConfig['casparcg-file-path'] 
        && env.appConfig['casparcg-server-version']) {
            if(!env.casparStatus.connected) {
                connectToCaspar()
                .then(() => displayMessage({message: 'CasparCG Server has been started'}))
                .catch(error => error && displayMessage({message: error, type: 'error'}));
            } else {
                disconnectFromCaspar()
                .then(() => displayMessage('Caspar has been stopped'))
                .catch(error => displayMessage({message: error, type: 'error'}));
            }
        } else {
            displayMessage({message: 'Missing CasparCG setup information', type: 'error'});
            return;
        }
    }

    // Attempts to overwrite the current casparcg.config file
    // @parma {object} data - The JSON data to be converted to 
    //                        XML and written to the local file system
    // @returns {Promise} - A promise that resolves if the data was written successfuly.
    function setCasparConfiguration(data) {
        return new Promise((resolve, reject) => {
            if(!Object.keys(data).length) return reject('No data to upload');
            if(!env.appConfig['casparcg-file-path']) return reject('Missing CasparCG file path in setup.');
            const xmlText = convertJsonToXML(data);
            let fileName = document.querySelector('.options-configuration .right select').value;
            if(fileName.indexOf('.json')) 
                fileName = fileName.substring(0, fileName.indexOf('.json'));
            ipc.send('request-update-caspar-config', {
                data: xmlText, 
                path: env.appConfig['casparcg-file-path'],
                fileName,
                overwrite: true
            });
            ipc.once('reply-update-caspar-config', (event, message) => {
                env.casparStatus.currentConfig = fileName + '.json';
                return resolve();
            });
        });
    }

    // Changes the App's main content
    // @param {object} event - The event object from the click event
    function handleChangePage(event) {
        let elem = event.target;
        while(elem.nodeName !== 'A') {
            elem = elem.parentElement;
        }
        const script = elem.getAttribute('name');
        try {
            window[env.loadedScript].uninitialize()
            .then(() => window[script].initialize())
            .then(() => {
                document.querySelector('nav a[name=' + env.loadedScript + ']').classList.remove('active');
                document.querySelector('nav  a[name=' + script + ']').classList.add('active');
                env.loadedScript = script;
            }).catch(error => {
                displayMessage({message: error, type: 'error'});
                return;
            })
        } catch (error) {
            displayMessage({message: error.message, type: 'error'});
            return;
        }
    }

    /*
        Helpers
    */

    // Converts an JSON object to XML woth @overrides
    // @param {object} obj - The object to be converted
    // @returns {string} A pretty printed XML string
    function convertJsonToXML(obj) {
        const oSerializer = new XMLSerializer();
        const doc = document.implementation.createDocument(null, null);
        function convert(name, data) {
            name = data._name ? data._name : name;
            const parent = doc.createElement(name);
            if(Array.isArray(data)) {
                data.forEach((item, i) => parent.append(convert(i, item)));
            } else if(typeof data === 'object') {
                Object.keys(data).filter(k => !k.includes('_'))
                    .forEach(k => parent.append(convert(k, data[k])));
            } else {
                parent.textContent = data;
            }
            return parent;
        }
        doc.append(convert('configuration', obj));
        let text = oSerializer.serializeToString(doc);
        text = '<?xml version="1.0" encoding="utf-8"?>' + text;
        return text;
    }

    // Displays a message to the message baord
    // @param {object} - An object with a message and message type prop
    function displayMessage(messages) {
        function createMessage(message, type) {
            const p = document.createElement('p');
            p.textContent = message;
            if(type) p.classList.add(type);
            return p;
        }

        const messageBoard = document.querySelector('aside.message-board .messages');
        if(messages instanceof Array) {
            messages.forEach(m => {
                messageBoard.appendChild(createMessage(m.message, m.type));
            });
        } else {
            if(typeof messages === 'string') messages = {message: messages};
            messageBoard.appendChild(createMessage(messages.message, messages.type));
        }
    }

    // Creates a new SVG icon
    // @param {string} ison - The name of the icon requested
    // @returns {DOM Element} - The SVG element within a button
    function createSvgIcon(icon) {
        if(!icon) return null;
        switch(icon) {
            case 'plus':
            case 'minus':
                const svg = new DOMParser().parseFromString(
                `<button>
                    <svg class="plus" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 675">
                        <circle cx="400" cy="337.5" r="304.65"/>
                        <line x1="220" y1="337.5" x2="580" y2="337.5"/>
                        <line x1="400" y1="157.5" x2="400" y2="517.5"/>
                    </svg>
                </button>`, 'text/html').querySelector('button');
                if(icon === 'minus') svg.classList = 'minus';
                return svg;
            case 'save':
                return new DOMParser().parseFromString(
                `<button>
                    <svg class="save" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <path d="M5, 5 H80 L95 20 V95 H5 Z" fill="white"/>
                        <rect x="20" y="0" width="40" height="30" fill="inherit"/>
                        <rect x="40" y="6" width="10" height="15" fill="white"/>
                        <rect x="15" y="45" width="65" height="40" fill="inherit"/>
                        <line x1="25" y1="58" x2="70" y2="58" stroke="white" stroke-width=".5rem"/>
                        <line x1="25" y1="70" x2="70" y2="70" stroke="white" stroke-width=".5rem"/>
                    </svg>
                </button>`, 'text/html').querySelector('button');
            case 'load':
                return new DOMParser().parseFromString(
                `<button id="load-configuration">
                    <svg class="load" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <path d="M5 50 V75 C5 95, 5 95, 15 95 H85 C95 95, 95 95, 95 75 V50" stroke="white" stroke-width=".5rem" fill="none" />
                        <line x1="50" y1="5" x2="50" y2="40" stroke="white" stroke-width=".5rem"/>
                        <polyline points="50 40, 70 40, 50 70, 30 40, 50 40" fill="white"/>
                    </svg>
                </button>`, 'text/html').querySelector('button');
            case 'upload':
                return new DOMParser().parseFromString(
                `<button id="load-configuration">
                    <svg class="load" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <path d="M5 50 V75 C5 95, 5 95, 15 95 H85 C95 95, 95 95, 95 75 V50" stroke="white" stroke-width=".5rem" fill="none" />
                        <line x1="50" y1="10" x2="50" y2="75" stroke="white" stroke-width=".5rem"/>
                        <polyline points="50 30, 70 30, 50 0, 30 30, 50 30" fill="white"/>
                    </svg>
                </button>`, 'text/html').querySelector('button');
            case 'trash':
                return new DOMParser().parseFromString(
                `<button>
                    <svg class="trash" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <path d="M50 0 H60 Q70 0, 70 10 H30 Q30 0, 40 0 Z" fill="white"/> 
                        <path d="M50 10 H88 Q100 10, 100 20 H0 Q0 10, 12 10 Z" fill="white"/>
                        <path d="M50 30 H90 L85 90 Q83 100, 75 100 H25 Q15 100, 15 90 L10 30 Z" fill="white"/>
                        <g stroke="#27303B" stroke-width=".5rem">
                            <line x1="30" y1="45" x2="32" y2="85"/>
                            <line x1="50" y1="45" x2="50" y2="85"/>
                            <line x1="70" y1="45" x2="68" y2="85"/>
                        </g>
                    </svg>
                </button>`, 'text/html').querySelector('button');
            case 'caspar':
                return new DOMParser().parseFromString(
                `<button>
                    <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#231F20" d="M289.172 135.625C296.527 152.192 310.012 164.464 316.141 172.44C359.472 158.687 439.774 158.765 482.859 172.44C488.988 164.464 502.473 152.192 509.828 135.625C517.183 119.059 529.442 87.1523 536.797 70.5856C544.152 54.0189 565.605 8.00002 626.898 8.00002C677.159 8.00002 736 50.9509 736 121.513C736 177.963 688.191 245.457 665.513 277.977C648.964 302.111 614.885 353.079 610.962 363.878C607.039 374.677 593.8 412.556 587.67 430.145C563.153 491.504 517.183 550.408 487.149 568.202C510.032 590.086 557.882 646.986 566.218 699.508C568.669 713.621 569.282 727.733 563.153 728.96C540.743 733.447 508.312 675.782 500.634 666.375L493.279 678.647L511.667 757.799C513.914 769.457 512.647 792.405 489.601 790.932C460.793 789.092 444.244 775.593 438.728 771.298C433.211 767.003 424.63 757.185 420.34 741.846C416.907 729.574 413.189 717.098 411.759 712.394H387.241C385.811 717.098 382.093 729.574 378.66 741.846C374.37 757.185 365.789 767.003 360.272 771.298C354.756 775.593 338.207 789.092 309.399 790.932C286.353 792.405 285.086 769.457 287.333 757.799L305.721 678.647L298.366 666.375C284.677 683.146 256.319 717.548 252.396 720.984L252.229 721.13C247.367 725.39 241.907 730.174 235.847 728.96C229.718 727.733 230.331 713.621 232.782 699.508C241.118 646.986 288.968 590.086 311.851 568.202C281.817 550.408 235.847 491.504 211.33 430.145C205.2 412.556 191.961 374.677 188.038 363.878C184.115 353.079 150.036 302.111 133.487 277.977C110.809 245.457 63 177.963 63 121.513C63 50.9508 121.842 8 172.102 8C233.395 8 254.848 54.0189 262.203 70.5856C269.558 87.1523 281.817 119.059 289.172 135.625Z"/>
                        <g>
                            <path fill="white" d="M417 337.176C417 342.699 409.389 346 400 346C390.611 346 383 342.699 383 337.176C383 331.654 390.611 326 400 326C409.389 326 417 331.654 417 337.176Z"/>
                            <path fill="white" d="M446 379.862C446 395.602 425.181 412 399.5 412C373.819 412 353 395.602 353 379.862C353 364.122 373.819 355 399.5 355C425.181 355 446 364.122 446 379.862Z"/>
                            <path fill="#F80A28" d="M425 397.5C425 397.5 413.807 408 400 408C386.193 408 375 397.5 375 397.5C375 397.5 386.193 387 400 387C413.807 387 425 397.5 425 397.5Z"/>
                        </g>
                        <g>
                            <circle fill="white" cx="268.5" cy="327.5" r="59.5"/>
                            <circle fill="white" cx="530.5" cy="327.5" r="59.5"/>
                            <path fill="black" d="M316 327C316 352.957 294.734 374 268.5 374C242.266 374 221 352.957 221 327C221 301.043 242.266 280 268.5 280C278.863 280 288.452 283.284 296.26 288.857C289.474 298.312 269.734 325.169 269.734 325.169C269.734 325.169 303.045 314.182 312.998 310.519C314.939 315.648 316 321.201 316 327Z"/>
                            <path fill="black" d="M578 327C578 352.957 556.734 374 530.5 374C504.266 374 483 352.957 483 327C483 301.043 504.266 280 530.5 280C540.863 280 550.452 283.284 558.26 288.857C551.474 298.312 531.734 325.169 531.734 325.169C531.734 325.169 565.045 314.182 574.998 310.519C576.939 315.648 578 321.201 578 327Z"/>
                        </g>
                    </svg>
                </button>`, 'text/html').querySelector('button');
            }
        }


    return {
        ipc,
        getAppConfig: function() {return env.appConfig},
        setAppConfig: function(config) {env.appConfig = config},
        getCasparStatus: function() {return env.casparStatus},
        setCasparConfiguration: function(data)  {return setCasparConfiguration(data)},
        createSvgIcon: function(icon) {return createSvgIcon(icon)},
        forceCasparStatusUpdate: function(status) {return forceCasparStatusUpdate(status)},
        displayMessage: function(message) {return displayMessage(message)}
    }
})();