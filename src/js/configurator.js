'use strict';

// Configuration Front End App
const _configuration = (function() {

    const env = {
        version: 'v2.2.0',
        loadedVersion: null,
        savedConfigs: [],
        currentConfig: {}
    },
    state = {
        initialized: false,
        shouldLoadDOM: false
    };

    // Initialize App
    (async function() {
        const config = _app.getAppConfig();
        const casparStatus = _app.getCasparStatus();
        const version = config['casaprcg-server-version'] 
            ? config['casaprcg-server-version']
            : env.version;
        const data = await loadServerVersion([version]);
        if(data.error) {
            displayMessage({message: 'Error fetching version options. ' + data.message, type: 'error'});
            return;
        }
        const latest = data[data.length - 1][version];
        env.version = Object.keys(data[data.length - 1])[0];
        env.loadedVersion = latest;
        const saves = await loadVersionSaves(env.version);
        if(!saves.error) {
            env.savedConfigs = saves;
        }
        initializeConfigDom(env.loadedVersion);
        initializeSavedDom(env.savedConfigs); 
        if(casparStatus.currentConfig 
            && env.savedConfigs.includes(casparStatus.currentConfig)) {
                const select = document.querySelector('.options-configuration .right select')
                select.value = casparStatus.currentConfig;
                handleLoadRemoteData();
        }
        state.initialized = true;
        if(state.shouldLoadDOM) {
            _configuration.initialize();
            state.shouldLoadDOM = false;
        }
    })();

    function initializeSavedDom(saves) {
        const rightSection = document.createElement('div'),
        loadConfig = createSvgIcon('load'),
        saveConfig = createSvgIcon('save'),
        uploadIcon = createSvgIcon('upload'),
        deleteConfig = createSvgIcon('trash'),
        options = document.querySelector('.main-section .options-configuration'),
        configNameNodes = createConfigurationOption({
            data: {
                _name: 'configuration-name',
                _type: 'list', 
                _required: true,
                _options: [...saves, 'add-new']
            }
        });

        rightSection.classList.add('right');

        configNameNodes.push(document.createElement('input'));
        if(saves.length) {
            configNameNodes[0].style.display = 'none';
            configNameNodes[2].style.display = 'none';
        } else {
            configNameNodes[1].style.display = 'none';
        }
        configNameNodes[1].classList.add('configuration-name');
        configNameNodes[1].removeEventListener('change', handleUpdateData);
        configNameNodes[1].addEventListener('change', handleToggleLoadSaveData);
        configNameNodes[2].classList.add('configuration-name');
        configNameNodes[2].addEventListener('blur', handleToggleLoadSaveData);

        loadConfig.addEventListener('click', handleLoadRemoteData);
        saveConfig.addEventListener('click', handleSaveDataRemotely);
        uploadIcon.addEventListener('click', handleSetCasparConfiguration);
        deleteConfig.addEventListener('click', removeDataRemotely);
        options.style.display = 'none';

        // Right section append nodes
        configNameNodes.forEach(elem => rightSection.appendChild(elem));
        rightSection.appendChild(loadConfig);
        rightSection.appendChild(saveConfig);
        rightSection.appendChild(uploadIcon);
        rightSection.appendChild(deleteConfig);
        options.appendChild(rightSection);
    }

    // Create the options an configuration container for the app 
    function initializeConfigDom(version) {
        const mainSection = document.querySelector('.main-section'),
            config = document.createElement('section'),
            title = document.createElement('h2'),
            minimumReq = document.createElement('button'),
            options = document.createElement('section'),
            // Create an object containing keys label, node and checkbox
            nodes = createConfigurationOption({
                data: {
                    _name: 'add-new',
                    _type: 'list', 
                    _options: Object.keys(version).filter(k => !k.includes('_'))
                }, isPlus: true
            });
        
        options.classList.add('options', 'options-configuration');
        config.classList.add('configuration');
        config.style.display = 'none';
        
        nodes[1].removeAttribute('name');
        
        title.textContent = 'Configuration';
        minimumReq.setAttribute('id', 'add-minimum-requirements');
        minimumReq.textContent = 'Add Minimum Requirements';
        minimumReq.addEventListener('click', handleAddMinimumRequirements);
        
        // Append option nodes
        options.appendChild(title);
        nodes.forEach(elem => options.appendChild(elem));
        options.appendChild(minimumReq);
        
        // Append main nodes to DOM
        mainSection.appendChild(options);
        mainSection.appendChild(config);
    }

    /*
        Server communication ipc functions
    */

    function loadServerVersion(versions) {
        return new Promise((resolve, reject) => {
            _app.ipc.send('request-server-versions', versions);
            _app.ipc.once('reply-server-versions', (event, arg) => resolve(arg));
        });
    }

    function loadVersionSaves(version) {
        return new Promise((resolve, reject) => {
            _app.ipc.send('request-version-saves', {version});
            _app.ipc.once('reply-version-saves', (event, arg) => resolve(arg));
        });
    }

    /*
        Data Searches, Validation, Storage and other Data Interactions
    */

    function handleFindPath(elem) {
        const data = {key: elem.getAttribute('name'), childElementCount: null};
        const path = [];
        if(elem.classList.contains('card')) 
            data.childElementCount = [...elem.childNodes].filter(n => n.classList.contains('card')).length;
        if(data.key) path.push(data);
        if(elem.parentElement && elem.parentElement.nodeName !== 'SECTION') {
            if(elem.nodeName === 'DIV' && elem.parentElement.classList.contains('card'))
                path[path.length - 1].childIndex = 
                    [...elem.parentElement.childNodes]
                        .filter(child => child.classList.contains('card'))
                        .findIndex(child => child === elem);
            
            const returned = handleFindPath(elem.parentElement);
            path.push(...returned);
           
        }
        return path;
    }

    function handleFindDataWithPath(paths, data) {
        paths.forEach(({key, childElementCount}, i) => {
            if(data instanceof Array) key = data.findIndex(d => d._name === key);
            if(data[key]) {
                data = data[key];
            }
        });
        return data;
    }

    // NOTE Got to update the correct child
    function handleEnsureDataWithPaths(paths, data, ref) {
        data = paths.reduce((acc, {key, childElementCount, childIndex}) => {
            if(ref instanceof Array) {
                while(acc.length < childElementCount) {
                    acc.push({});
                }
                if(!acc.length) acc.push({});
                ref = ref[ref.findIndex(r => r._name === key)];
                acc = childIndex !== null ? acc[childIndex] : acc;
                // Add _name prop to sub objects
                if((acc instanceof Array) === false) acc._name = key;
            } else if(!ref[key]._type) {
                if(!acc[key]) acc[key] = ref[key] instanceof Array ? [] : {};
                while(acc[key].length < childElementCount) {
                    acc[key].push({});
                }
                ref = ref[key];
                acc = acc[key];
            }
            return acc;
        }, data);
        return {data, parent: ref};
    }

    function validateData(data, reference) {
        if(!reference) throw new Error('Missing reference');
        switch(reference._type) {
            case 'list':
                if(!reference._options.includes(data)) throw new Error("'" + data + "' is an invalid option.");
                break;
            case 'boolean':
                typeof data === 'string' && data === 'true'
                    ? data = true : data = false;
                break;
            case 'number':
                if(isNaN(data)) throw new Error("'" + data + "' is an invalid number.");
                data = Number(data);
                break;
            case 'string':
            default:
                if(typeof data !== 'string') throw new Error(data + ' is an invalid string');
                break;
        }
        return data;
    }

    function handleCleanData(data) {
        if(data instanceof Array) {
            if(!data.length) return false;
            data = data.filter(item => handleCleanData(item))
                .filter(item => Object.keys(item).filter(k => !k.includes('_')).length);
        } else {
            const keys = Object.keys(data).filter(k => !k.includes('_'));
            if(!keys.length) return false;
            for(let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if(typeof data[key] === 'object') {
                    data[key] = handleCleanData(data[key]);
                    if(!Object.keys(data[key]).length) delete data[key];
                }
            }
        }
        return data;
    }

    function saveDataRemotely(data) {
        const elements = document.querySelectorAll('.configuration-name');
        const elem = elements[0].style.display !== 'none' 
        ? elements[0] : elements[1];
        const fileName = elem.value;
        if(!fileName.length) throw new Error('Missing configurations name');
        const message = {
            version: env.version,
            fileName,
            data
        }
        return new Promise((resolve, reject) => {
            _app.ipc.send('request-save-configuration-data', message);
            _app.ipc.on('reply-save-configuration-data', (event, message) => {
                if(!message.error) {
                    message = message.message;
                    if(!elem.nodeName === 'INPUT' 
                        || env.savedConfigs.includes(message)) return resolve();
                    const select = document.querySelector('select.configuration-name');
                    const option = document.createElement('option');
                    option.value = message;
                    option.textContent = upperCase(message);
                    select.insertBefore(option, select.childNodes[select.childElementCount - 1]);
                    select.value = message;

                    env.savedConfigs.push(message);
                    return resolve();
                } else {
                    return reject(message);
                }
            });
        });
        
    }

    // @returns [array || boolean] - An array of missing values or true / false if it succeeded
    function saveDataLocally(value, path) {
        const ref = env.loadedVersion,
            currentConfig  = env.currentConfig,
            key = path.pop().key,
            {data, parent} = handleEnsureDataWithPaths(path, currentConfig, ref),
            // Get all the required children
            required = Object.values(parent)
                .filter(i => typeof i === 'object')
                .filter(item => item._required),
            missing = [];
        if(value === null) {
            delete data[key]; 
        } else {
            data instanceof Array ? data[0][key]= value : data[key]= value;
            required.forEach(item => {
                if(!data[item._name]) {
                    item._default ? data[item._name] = item._default : missing.push(upperCase(item._name, '-'));
                }
            });
            if(missing.length) throw missing;
        }
        return true;
    }

    function removeDataRemotely() {
        const elements = document.querySelectorAll('.configuration-name');
        const elem = elements[0].style.display !== 'none' 
        ? elements[0] : elements[1];
        const fileName = elem.value;
        try {
            if(!fileName.length) throw new Error('Missing configurations name');
            if(!env.savedConfigs.includes(fileName)) 
                throw new Error("Invalid config name '" + fileName + "'");
        } catch (error) {
            displayMessage({message: error.message, type: 'error'});
            return;
        }
        _app.ipc.send('request-delete-config', {version: env.version, fileName});
        _app.ipc.once('reply-remove-success', (event, message) => {
            if(!message.error) {
                elem.removeChild(elem.childNodes[elem.selectedIndex]);
                handleToggleLoadSaveData({target: elem});
                displayMessage({message: message.message});
            } else {
                displayMessage({message: message.message, type: 'error'});
                return;
            }
        });
    }

    function removeDataLocally(paths) {
        let ref = env.loadedVersion,
            data = env.currentConfig;
        paths.forEach(({key, childElementCount, childIndex}, i) => {
            if(ref instanceof Array) {
                // Can't remove data that does not excits
                if(!data[childIndex]) {
                    throw new Error();
                } else {
                    // On final iteration, remove the data
                    if(i === paths.length - 1 && data) {
                        data.splice(childIndex, 1);
                    } else {
                        ref = ref[ref.findIndex(r => r._name === key)];
                        data = data[childIndex]; 
                    }
                }
            } else if(!ref[key]._type) {
                // Can't remove data that does not excits
                if(!data[key]) {
                    throw new Error();
                } else {
                    // On final iteration, delete the data
                    if(i === paths.length - 1 && data) {
                        delete data[key];
                    } else {
                        ref = ref[key];
                        data = data[key];
                    }
                }
                
            }
        });
    }

    function handleSetValues(nodes, ref) {
        Object.keys(ref).filter(k => !k.includes('_')).forEach(k => {
            const e = nodes.querySelector('[name=' + k + ']');
            if(e.nodeName === 'DIV') {
                ref[k] ? e.classList.add('checked') : e.classList.remove('chekced');
            } else {
                if(e.nextElementSibling && e.nextElementSibling.nodeName === 'BUTTON') return;
                e.value = ref[k];
            }
            if(e.nextElementSibling && e.nextElementSibling.classList.contains('validate'))
                e.nextElementSibling.classList.add('checked');
        })
    }

    function convertJsontoGui(data, ref) {
        return Object.keys(data).filter(k => !k.includes('_')).map(k => {
            let parent = document.createElement('div');
            parent.setAttribute('name', k);
            parent.classList.add('card');
            if(data[k] instanceof Array) {
                parent.appendChild(createConfigurtionSection([{_name: k}]).childNodes[0]);
                data[k].forEach((e, i) => {
                    const path = ref[k].length > 1 
                        ? ref[k].findIndex(r => r._name === e._name)
                        : 0;
                    if(!ref[k][path]._name) ref[k][path] = k;
                    const card = createConfigurtionSection(ref[k][path]);
                    parent.append(card);
                    convertJsontoGui(data[k][i], ref[k][path]).forEach(e => {
                        if(e.childNodes.length) 
                            parent.childNodes[parent.childElementCount - 1].appendChild(e);
                    });
                    if(parent.childNodes.length) handleSetValues(parent.childNodes[i + 1], data[k][i]);
                });
            } else if(typeof data[k] === 'object' || env.loadedVersion[k] !== undefined) {
                // Top level objects will have data as the value, thus not an object
                if(env.loadedVersion[k] !== undefined && typeof data[k] !== 'object') {
                    // Nest it for the createConfigurtionSection function
                    data[k] = {[k]: data[k]};
                    // Get the H2 tag for the title
                    parent.appendChild(createConfigurtionSection({_name: k}).childNodes[0]);
                } 
                if(!ref[k]._name) ref[k]._name = k;
                const card = createConfigurtionSection(ref[k]);
                [...card.childNodes].forEach(elem => parent.appendChild(elem));
                if(parent.childNodes.length) handleSetValues(parent, data[k]);
                Object.entries(data[k]).forEach(i => {
                    if(i[0].indexOf('_') !== -1) return;
                    if(ref[k][i[0]] instanceof Array) {
                        handleSetValues(parent, data[k][i[0]][0])
                    }
                })
            }            
            return parent;
        });
    }

    /*
        Data to DOM Conversion
    */
    function createConfigurationHeader(_name, isArr) {
        const h2 = document.createElement('h2');
        const icon = isArr ? createSvgIcon('plus') : createSvgIcon('minus');
        //h2.setAttribute('name', _name);
        h2.textContent = upperCase(_name, '-');
        h2.appendChild(icon);
        isArr ? icon.addEventListener('click', handleAddSection): icon.addEventListener('click', handleRemoveSection);
        return h2;
    }

    // Creates a label, input type, and checkbox or plus icon
    // @param {object} data - The data object to be used for the input
    function createConfigurationOption({data, isPlus}) {
        const label = document.createElement('label');
        const uuid = data._name + (Math.random() * 10000);
        let node, controller;
        label.setAttribute('for', uuid);
        label.textContent = data._required ? upperCase(data._name + ' *', '-') : upperCase(data._name, '-');
        switch(data._type) {
            case 'list':
                node = document.createElement('select');
                try {
                    data._options.map((item, i) => {
                        const option  = document.createElement('option');
                        option.value = item;
                        option.textContent = upperCase(item, '-');
                        node.appendChild(option);
                    });
                } catch (error) {
                    throw new Error('Error creating list for ' + data._name + ' ' + error.message);
                }
                node.addEventListener('change', handleUpdateData);
                break;
            case 'boolean':
                node = document.createElement('div');
                node.classList = 'checkbox';
                node.addEventListener('click', handleCheckBox);
                break;
            case 'number':
            case 'string':
            default:
                node = document.createElement('input');
                node.placeholder = data._type === 'string' ? 'Text' : 'Number';
                node.addEventListener('blur', handleUpdateData);
                break;
        }
        if(isPlus) {
            controller = createSvgIcon('plus');
            controller.addEventListener('click', handleAddSection);
            node.removeEventListener('change', handleUpdateData);
        } else {
            controller = document.createElement('div');
            controller.classList = 'checkbox validate';
            controller.addEventListener('click', handleCheckBox);
        }
        node.setAttribute('name', data._name);
        node.setAttribute('id', uuid);
        return data._required === true ? [label, node] : [label, node, controller];
    }

    function createConfigurtionSection(section) {
        const card = document.createElement('div');
        card.classList = 'card';
        if(section instanceof Array) {
            const name = section._name ? section._name : section[0]._name;
            card.setAttribute('name', section._name);
            if(section.length > 1) {
                createConfigurationOption({data: {
                    _name: name, 
                    _type: 'list', 
                    _options: section.map(item => item._name)
                }, isPlus: true}).forEach(elem => card.append(elem));
            } else {
                const h2 = createConfigurationHeader(name, true);
                h2.setAttribute('name', section._name)
                card.append(h2);
                card.append(createConfigurtionSection(section[0]));
            }
        } else { 
            if(section._type !== undefined) {
                createConfigurationOption({data: section}).forEach(elem => card.appendChild(elem));
            } else {
                const h2 = createConfigurationHeader(section._name, false);
                let afterElem = 0;
                card.append(h2)
                card.setAttribute('name', section._name);

                Object.keys(section).filter(k => !k.includes('_')).forEach(k => {
                    section[k]._name = k;
                    const sub = createConfigurtionSection(section[k]);
                    [...sub.children].forEach((elem, i) => {
                        // Sort the required elements first
                        if(section[k]._required) {
                            card.insertBefore(elem, card.childNodes[afterElem + i].nextElementSibling);
                        } else {
                            card.appendChild(elem);
                        }
                    });
                    // Requrired elements do not have a checkbox 
                    // so increment the counter by 2 (label, data value node)
                    if(section[k]._required) afterElem += 2;
                });
            }
        }
        return card;
    }

    /*
        DOM Helpers - Event Listeners
    */
   

    function handleToggleLoadSaveData(event) {
        const elem = event.target;
        const other = [...document.querySelectorAll('.options-configuration .right *')]
            .filter(e => e.style.display === 'none');
        if(elem.nodeName === 'SELECT') {
            if(elem.value === 'add-new') {
                elem.value = elem.childNodes[0].value
                elem.style.display = 'none';
                other.forEach(e => e.style.display = 'unset');
            }
        } else {
            if(!elem.value.length) {
                elem.style.display = 'none';
                document.querySelector('.options-configuration .right label').style.display = 'none';
                other.forEach(e => e.style.display = 'unset');
            }
        }
    }

    function handleLoadRemoteData(event) {
        const elem = document.querySelector('.options-configuration .right select');
        if(elem.style.display === 'none' || elem.value === 'add-new') return;
        const message = {name: elem.value, version: env.version};
        _app.ipc.send('request-load-save-file', message);
        _app.ipc.once('reply-load-save-file', (event, args) => {
            const configuration = document.querySelector('.configuration');
            configuration.innerHTML = '';
            convertJsontoGui(args, env.loadedVersion).forEach(elem => configuration.appendChild(elem))
            env.currentConfig = args;
            displayMessage('Loaded ' + message.name + ' successfully');
        });
    }

    function handleSaveData(trigger) {
        const elem = trigger.classList.contains('validate') 
            ? trigger.previousElementSibling : trigger;
        const next = elem.nextElementSibling;
        const path = handleFindPath(elem).reverse();
        let value = getValueFromNodes(elem);
        if(next && next.classList.contains('validate') 
            && !next.classList.contains('checked')) value = null;
        try {
            saveDataLocally(value, path);
        } catch (error) {
            if(error instanceof Array) {
                displayMessage({message: 'Missing required data ' + error.join(', ').substring(-2), type: 'warn'});
            } else {
                displayMessage({message: error, type: 'error'});
            }
        }
    }

    function handleSetCasparConfiguration() {
        _app.setCasparConfiguration(env.currentConfig).then(() => {
            displayMessage('The current configuration was successfully created');
        }).catch(error => {
            displayMessage({message: error, type: 'error'});
            return;
        });
    }

    function handleValidateData(trigger) {
        const elem = trigger.classList.contains('validate') 
            ? trigger.previousElementSibling : trigger;
        const path = handleFindPath(elem).reverse();
        const ref = handleFindDataWithPath(path, env.loadedVersion);
        let value;
        if(elem.classList.contains('checkbox')) {
            value = elem.classList.contains('checked') ? true : false;
        } else {
            value = elem.value;
        }
        return validateData(value, ref);
    }

    function handleUpdateData(event) {
        const elem = event.target.classList.contains('validate') 
            ? event.target.previousElementSibling : event.target;
        const next = elem.nextElementSibling;
        if(next && next.nodeName === 'DIV' && !next.classList.contains('checked')) return;
        try {
            handleValidateData(elem);
        } catch (error) {
            displayMessage({message: error.message, type: 'error'});
        }
        try {
            handleSaveData(elem);
        } catch (error) {
            displayMessage({message: error.message, type: 'error'});
        }
    }

    async function handleSaveDataRemotely(event) {
        const data = handleCleanData(JSON.parse(JSON.stringify(env.currentConfig)));
        const elem = document.querySelectorAll('.configuration-name')[0].style.display !== 'none' 
            ? document.querySelectorAll('.configuration-name')[0]
            : document.querySelectorAll('.configuration-name')[1];
        if(!data || !Object.keys(data).length) {
            displayMessage({message: 'No data to save', type: 'error'});
            return;
        } 
        try {
            await saveDataRemotely(data);
            if(elem.nodeName === 'INPUT') elem.value = '';
            handleToggleLoadSaveData({target: elem});
        } catch (error) {
            displayMessage({message: 'Error saving data to file', type: 'warn'});
        }
        displayMessage('Remote and local updates saved successfully');
    }

    function handleCheckBox(event) {
        event.target.classList.toggle('checked');
        if(event.target.classList.contains('validate')) {
            try {
                handleValidateData(event.target);
            } catch (error) {
                displayMessage({message: error, type: 'error'});
            }
        }
        try {
            handleSaveData(event.target);
        } catch (error) {
            displayMessage({message: error, type: 'error'});
        }
    }

    function handleAddSection(event) {
        const button = ensureElement('button', event.target);
        const parent = button.previousElementSibling !== null 
            ? button.previousElementSibling 
            : button.parentElement;
        const parentType = parent.parentElement.nodeName;
        const value = parent.nodeName === 'SELECT' ? parent.value : parent.getAttribute('name');
        const path = handleFindPath(parent).reverse();

        // Check if any paths need to be added
        if(parent.nodeName === 'H2') path.push({
            key: parent.nextElementSibling.getAttribute('name'), 
            childElementCount: null
        });
        if(value) path.push({key: value, childElementCount: null});

        // Find data to create
        let data = handleFindDataWithPath(path, {...env.loadedVersion});
        if(data._name === undefined) data._name = value;
        if(data._type) data = {[value]: data, _name: value};

        let DOMParent; 
        parentType === 'SECTION'
                ? DOMParent = document.querySelector('.configuration')
                : DOMParent = parent.parentElement;
        if(parent.nodeName === 'SELECT' && parentType !== 'SECTION') {
            const subParentName = path[path.length - 2].key
            let subParent = DOMParent.querySelector('.card[name=' + subParentName + ']');
            if(!subParent) {
                subParent = document.createElement('div');
                subParent.classList.add('card');
                subParent.setAttribute('name', subParentName);
                DOMParent.appendChild(subParent);
            }
            DOMParent = subParent;
        } else if(parent.nodeName === 'SELECT' && parentType === 'SECTION') {
            try {
                let subParent = DOMParent.querySelector('.card[name=' + value + ']');
                if(!(data instanceof Array) && subParent) throw new Error(upperCase(value, '-') + ' can only be in the configuration once.');
                if(subParent) {
                    DOMParent = subParent;
                    data = data[0];
                }
            } catch (error) {
                displayMessage({message: error.message, type: 'error'});
                return;
            }
        }

        // Attempt to create the section as DOM elements
        try {
            const section = createConfigurtionSection(data);
            DOMParent.appendChild(section);
        } catch (error) {
            if(error.message.includes('Cannot create property')) {
                displayMessage({
                    message: 'Error when creating DOM elements. Check the server version file. ' + error.message, 
                    type: 'error'
                });
            } else {
                displayMessage({message: error.message, type: 'error'});
            }
        }
        displayMessage('Section ' + upperCase(value, '-') + ' added successfully');
    }

    function handleAddMinimumRequirements(event) {
        if(env.loadedVersion._required) {
            env.loadedVersion._required.forEach(req => {
                try {
                    if(!document.querySelector('.configuration .card[name=' + req + ']')) {
                        env.loadedVersion[req]._name = req;
                        document.querySelector('.configuration')
                            .appendChild(createConfigurtionSection(env.loadedVersion[req]))
                    }
                } catch (error) {
                    displayMessage({
                        message: 'Error with ' + req + ' requirement. ' + error.message, 
                        type: 'error'
                    });
                }
            });
        }
    }

    function handleRemoveSection(event) {
        const button = ensureElement('button', event.target),
            card = ensureElement('div', button),
            parent = card.parentElement,
            path = handleFindPath(button).reverse();
        
        try {
            removeDataLocally(path);
        } catch (error) {
            if(error.message.length) {
                displayMessage({message: error.message, type: 'error'});
                return;
            }
        }
        parent.removeChild(card);
        if(parent.childNodes.length === 1 && parent.childNodes[0].nodeName === 'H2') {
            parent.parentElement.removeChild(parent);
        }
    }

    /*
        DOM Helpers
    */

    function ensureElement(type, elem) {
        if(elem.nodeName.toLowerCase() !== type.toLowerCase()) {
            if(elem.nodeName === 'SECTION') return elem;
            return ensureElement(type, elem.parentElement);
        } else {
            return elem;
        }
    }

    function getValueFromNodes(elem) {
        let value;
        if(elem.classList.contains('checkbox')) {
            value = elem.classList.contains('checked') ? true : false;
        } else {
            value = elem.value.length ? elem.value : null;
        }
        return value;
    }

    /*
        Helpers
    */

    function displayMessage(message) {
        _app.displayMessage(message);
    }

    function upperCase(value, split) {
        if(split !== undefined) {
            return value.split(split).map(e => 
                e.substring(0,1).toUpperCase() + e.substr(1)).join(' ');
        } else {
            return value.substring(0,1).toUpperCase() + value.substr(1);
        }
    }

    function createSvgIcon(icon) {
        return _app.createSvgIcon(icon);
    }

    return {
        initialize: function() {
            if(!state.initialized) {
                state.shouldLoadDOM = true;
            } else {
                const elems = document.querySelectorAll('.main-section .options-configuration, .main-section > .configuration');
                const casparStatus = _app.getCasparStatus();
                elems.forEach(e => e.style.removeProperty('display'));
                if(!Object.keys(env.currentConfig).length) {
                    if(casparStatus.connected && casparStatus.currentConfig) {

                    }
                }
            }
        },
        uninitialize: function() {
            return new Promise((resolve, reject) => {
                const elems = document.querySelectorAll('.main-section .options-configuration, .main-section > .configuration');
                elems.forEach(e => e.style.display = 'none');
                return resolve();
            });
        }
    }
})();

window['_configuration'] = _configuration;