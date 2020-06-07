const moment = require('moment');

module.exports = function() {
    this.time = function (format) {
        return moment().format(format);
    }
}