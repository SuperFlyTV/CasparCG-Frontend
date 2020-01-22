'use strict';

const _fs = require('fs');

const checkLocalFile = (path, create) => {
    return new Promise((resolve, reject) => {
        if(!_fs.existsSync(path)) {
            if(create) {
                try {
                    _fs.mkdirSync(path, {recursive: true});
                    
                } catch (error) {
                    return reject(error.message);
                }
            } else {
                return reject(`"${path}" does not excists`);
            }
        }
        return resolve();
    });
}

const getLocalFile = path => {
    return new Promise((resolve, reject) => {
        if(!_fs.existsSync(path)) return reject(`"${path}" does not excists`);
        let data = '';
        const stream = _fs.createReadStream(path);
        stream.on('data', chunk => data += chunk.toString());
        stream.on('end', () => resolve(data));
        stream.on('error', error => reject(error));
    });
}

const createLocalFile = (data, file, path) => {
    return new Promise((resolve, reject) => {
        if(!_fs.existsSync(path)) return reject(`"${path}" does not excists`);
        try {
            const stream = _fs.createWriteStream(path + '\\' + file);
            stream.write(data);
            stream.on('finish', () => resolve());
            stream.on('error', error => {return reject(error)});
            stream.end();
        } catch (error) {
            return reject(error.message);
        }
    });
}

const removeLocalFile = (path) => {
    return new Promise((resolve, reject) => {
        if(!_fs.existsSync(path)) return reject(`"${path}" does not excists`);
        _fs.unlink(path, error => {
            if(error) return reject(error);
            return resolve();
        });
    });
}


module.exports.checkLocalFile = checkLocalFile;
module.exports.getLocalFile = getLocalFile;
module.exports.createLocalFile = createLocalFile;
module.exports.removeLocalFile = removeLocalFile;