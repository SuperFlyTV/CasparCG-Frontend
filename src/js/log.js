'use strict';

const _logs = (function() {

    const env = {
        maxLogCount: 100,
        logs: [],
        initializeLogs: []
    }
    const state = {
        initialized: false,
        shouldLoadDOM: false,
        casparCGInitializing: true,
        displayInitialized: false
    };

    (function() {
        initializeDomLog();

        _app.ipc.on('log-caspar-message', (event, data) => {
            let initializeLog = false;
            if(state.casparCGInitializing) {
                if(data.message.indexOf('Received message from') !== -1
                || data.message.indexOf('async_event_server') !== -1) {
                    state.casparCGInitializing = false;
                } else {
                    if(_app.getCasparStatus().connected === 'pending') 
                        _app.forceCasparStatusUpdate(true);
                    initializeLog = true;
                }
            }
            if(state.displayInitialized && initializeLog) {
                handleAddLog(data.message, data.type);
            } else if(!state.displayInitialized) {
                handleAddLog(data.message, data.type);
            }
            if(initializeLog) {
                env.initializeLogs.push(data.message);
            } else {
                env.logs.push({message: data.message, type: data.type})
            }
        });

        state.initialized = true;
        if(state.shouldLoadDOM) {
            _logs.initialize();
            state.shouldLoadDOM = false;
        }
    })();

    function initializeDomLog() {
        const main = document.querySelector('.main-section'),
            options = document.createElement('section'),
            logger = document.createElement('section'),
            h2 = document.createElement('h2'),
            view = document.createElement('button'),
            clear = document.createElement('button');
        h2.textContent = 'Logger';

        options.classList = 'options options-logs';
        logger.classList = 'logs';

        options.style.display = 'none';
        logger.style.display = 'none';
        view.textContent = 'View Setup Logs';
        clear.textContent = 'Clear Logs';

        view.addEventListener('click', handleToggleSetupLogs);
        clear.addEventListener('click', handleClearLogs);

        options.append(h2, view, clear);
        main.append(options, logger);
    }

    function handleAddLog(log, type) {
        function createLogElements(message, type) {
            const div = document.createElement('div'),
                log = document.createElement('p'),
                time = document.createElement('p'),
                checkbox = document.createElement('div');
            const date = new Date();
            message = message.replace(/\[(.*?)\]/g, '');

            log.textContent = message;
            time.textContent = date.getHours() + ':' + date.getMinutes() +':' + date.getSeconds();
            time.classList.add('time');
            checkbox.classList.add('checkbox');
            checkbox.addEventListener('click', checkBox);

            switch(type) {
                case 'error':
                    log.classList.add('error');
                    break;
                case 'warning':
                    log.classList.add('warning');
                default:
                    break;
            }

            div.append(log, time, checkbox);
            return div;
        }

        const logs = document.querySelector('.main-section .logs');
        const logElem = createLogElements(log, type);
        
        if(logs.childElementCount > env.maxLogCount) 
            logs.removeChild(logs.childNodes[0]);
        logs.appendChild(logElem);
    }

    function handleToggleSetupLogs(event) {
        const main = document.querySelector('.main-section .logs');
        main.innerHTML = '';
        if(state.displayInitialized) {
            state.displayInitialized = false;
            event.target.textContent = 'View Setup Logs';
            if(!env.logs.length) {
                displayMessage({message: 'No standard logs to display', type: 'warn'});
                return
            }
            env.logs.forEach(log => {
                handleAddLog(log.message, log.type);
            });
        } else {
            if(!env.initializeLogs.length) {
                displayMessage({message: 'No setup logs to display', type: 'warn'});
                return
            }
            env.initializeLogs.forEach(log => {
                handleAddLog(log);
            });
            event.target.textContent = 'View Standard Logs';
            state.displayInitialized = true;
        }
    }

    function handleClearLogs() {
        const main = document.querySelector('.main-section .logs');
        main.innerHTML = '';
        env.logs = [];
    }

    function restartLogger() {
        const button = document.querySelector('.main-section .options-logs button:first-of-type');
        state.casparCGInitializing = true;
        state.displayInitialized = true;
        env.initializeLogs = [];
        handleClearLogs();
        //handleToggleSetupLogs({target: button});
        return true;
    }

    /*
        Helpers
    */

    function checkBox(event) {
        if(event.target.classList.contains('checked')){
            event.target.classList.remove('checked');
        } else {
            event.target.classList.add('checked');
        }
    }

    function displayMessage(message) {
        _app.displayMessage(message);
    }


    return {
        restartLogger,
        initialize: function() {
            if(!state.initialized) {
                state.shouldLoadDOM = true;
            } else {
                const elems = document.querySelectorAll('.main-section > .logs, .main-section .options-logs');
                elems.forEach(e => e.style.removeProperty('display'));
            }
        },
        uninitialize: function() {
            return new Promise((resolve, reject) => {
                const elems = document.querySelectorAll('.main-section > .logs, .main-section .options-logs');
                elems.forEach(e => e.style.display = 'none');
                return resolve();
            });
        }
    }
})();

window['_logs'] = _logs;