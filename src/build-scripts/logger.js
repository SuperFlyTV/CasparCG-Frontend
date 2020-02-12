'use strict';

// Logs colorful messages
const Logger = (function() {
    const colors = {
        text: {
            black: '\x1b[30m',
            red: '\x1b[31m',
            white: '\x1b[37m'
        },
        bg: {
            black: '\x1b[40m',
            red: '\x1b[41m',
            green: '\x1b[42m',
            white: '\x1b[47m'
        }
    }

    function logMessage(message, type) {
        if(!message) return;
        let colorScheme;
        switch(type) {
            case 'success':
            case true:
                colorScheme = `${colors.text.black}${colors.bg.green}%s\x1b[0m`;
                break;
            case 'failed':
            case false:
                colorScheme = `${colors.text.white}${colors.bg.red}%s\x1b[0m`;
                break;
            default:
                colorScheme = `${colors.text.white}${colors.bg.black}%s\x1b[0m`;
        }
        console.log(colorScheme, message);
        return;
    }

    return {
        logMessage
    }

})();

module.exports = Logger;