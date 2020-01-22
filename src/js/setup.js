'use strict';

const _setup = (function() {
    const state = {
        initialized: false,
        shouldLoadDOM: false
    };

    (function() {
        initializeConfigDom();
        initializeForm(_app.getAppConfig());
        state.initialized = true;
        if(state.shouldLoadDOM) {
            _setup.initialize();
            state.shouldLoadDOM = false;
        }
    })();

    function initializeConfigDom() {
        const main = document.querySelector('.main-section'),
            options = document.createElement('section'),
            setup = document.createElement('section'),
            h2 = document.createElement('h2'),
            form = document.createElement('form'),
            exePath = createCreateFormElements('CasparCG File Path', 'string'),
            vesion = createCreateFormElements('CasparCG Server Version', 'array', ['v2.2.0']),
            save = _app.createSvgIcon('save');
        
        options.style.display = 'none';
        setup.style.display = 'none';
        options.classList.add('options', 'options-setup');
        setup.classList.add('setup');
        setup.style.display = 'none';
        h2.textContent = 'Server Setup';
        exePath[1].setAttribute('placeholder', 'Path to casparcg.exe file. Ex: C:\\Users\\me\\casparcg.exe');
        save.addEventListener('click', handleSaveAppConfig);
        
        options.appendChild(h2);
        exePath.forEach(e => form.appendChild(e));
        vesion.forEach(e => form.appendChild(e));
        form.appendChild(save);
        setup.appendChild(form);
        
        main.append(options, setup);
    }

    function initializeForm(config) {
        const setup = document.querySelector('.main-section .setup'),
            data = setup.querySelectorAll('input, select, div');
        data.forEach(elem => {
            const name = elem.previousElementSibling.textContent.replace(/ /g, '-').toLowerCase();
            if(config[name] !== undefined) {
                elem.value = config[name];
            }
        });
    }

    function saveAppConfigRemotely(data) {
        return new Promise((resolve, reject) => {
            if(!Object.keys(data).length) return reject('No data to save');
            _app.ipc.send('request-save-app-config', data);
            _app.ipc.once('reply-save-app-config', (event, args) => {
                return resolve();
            });
        });
    }

    function handleSaveAppConfig(event) {
        event.preventDefault();
        const form = document.querySelector('.main-section .setup form');
        let data = {};
        let index = 0;
        // Get all the form data elements
        try {
            while(form[index]) {
                const elem = form[index];
                const name = elem.previousElementSibling.textContent.replace(/ /g, '-').toLowerCase();
                if(elem.nodeName !== 'BUTTON') {
                    if(!elem.value) throw new Error('Missing value for ' + elem.previousElementSibling.textContent);
                    data[name] = elem.value;
                }
                index++;
            }
        } catch (error) {
            displayMessage({message: error.message, type: 'error'});
            return;
        }
        if(data['casparcg-file-path'].indexOf('/casparcg.exe') === -1)
            data['casparcg-file-path'] += '/casparcg.exe';
        saveAppConfigRemotely(data).then(() => {
            _app.setAppConfig(data);
            displayMessage('Successfully Saved config');
        }).catch(error => {
            displayMessage(error);
            return;
        });
    }

    function createCreateFormElements(text, type, options) {
        const uuid = text.replace(/ /g, '-') + (Math.random() * 10000);
        const label = document.createElement('label');
        let node;
        label.textContent = text;
        label.setAttribute('for', uuid);
        switch(type) {
            case 'boolean':
                node = document.createElement('div');
                node.classList.add('checkbox');
                break;
            case 'array':
                if(!options || !options.length) throw new Error('No options');
                node = document.createElement('select');
                options.forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item;
                    opt.textContent = item;
                    node.appendChild(opt);
                });
                break;
            case 'string':
            case 'number':
            default:
                node = document.createElement('input');
                break;
        }
        node.setAttribute('id', uuid);
        return [label, node];
    }

    function displayMessage(message) {
        _app.displayMessage(message);
    }


    return {
        initialize: function() {
            if(!state.initialized) {
                state.shouldLoadDOM = true;
            } else {
                const elems = document.querySelectorAll('.main-section > .setup, .main-section .options-setup');
                elems.forEach(e => e.style.removeProperty('display'));
            }
        },
        uninitialize: function() {
            return new Promise((resolve, reject) => {
                const elems = document.querySelectorAll('.main-section > .setup, .main-section .options-setup');
                elems.forEach(e => e.style.display = 'none');
                return resolve();
            });
        }
    }

})();

window['_setup'] = _setup;