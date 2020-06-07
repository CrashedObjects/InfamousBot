module.exports = function() {
    this.parseTime = function(time) {
        time = time.toLowerCase();
        time = time.trim();
        const regexreplace = /^\d+(\.|,)?\d*\s*[a-zA-Z]+\s*/i;
        const regexweek = /^\d+(\.|,)?\d*\s*w/i;   
        const regexday = /^\d+(\.|,)?\d*\s*d/i;
        const regexhour = /^\d+(\.|,)?\d*\s*h/i;
        const regexmin = /^\d+(\.|,)?\d*\s*m/i;
        const regexsec = /^\d+(\.|,)?\d*\s*s/i;

        var weeks = 0;
        var days = 0;
        var hours = 0;
        var mins = 0;
        var secs = 0;

        if (regexweek.test(time)) {
            weeks = weeks + time.substring(0,time.indexOf("w"));
            time = time.replace(regexreplace, "");
            if (isNaN(weeks)) weeks = 0;
        }
        if (regexday.test(time)) {
            days = days + time.substring(0,time.indexOf("d"));
            time = time.replace(regexreplace, "");
            if (isNaN(days)) days = 0;
        }
        if (regexhour.test(time)) {
            hours = hours + time.substring(0,time.indexOf("h"));
            time = time.replace(regexreplace, "");
            if (isNaN(hours)) hours = 0;
        }
        if (regexmin.test(time)) {
            mins = mins + time.substring(0,time.indexOf("m"));
            time = time.replace(regexreplace, "");
            if (isNaN(mins)) mins = 0;
        }
        if (regexsec.test(time)) {
            secs = secs + time.substring(0,time.indexOf("s"));
            time = time.replace(regexreplace, "");
            if (isNaN(secs)) secs = 0;
        }

        secs = (weeks * 7 * 24 * 60 * 60) + (days * 24 * 60 * 60) + (hours * 60 * 60) + (mins * 60) + secs;

        time = time.trim();

        if (time.length > 0) {
            return [secs, time];
        } else {
            return secs;
        }
    }
}