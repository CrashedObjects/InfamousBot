const moment = require('moment');

module.exports = function() {
    this.timeNow = function (format) {
        return moment().format(format);
    }
    this.time = function (specificTime, format) {
        return moment(specificTime,"X").format(format);
    }
}