const { Client } = require('discord.js');
require('./time.js')();
require ('./infTimer.js')();

//var nextIntervalRun = 0;

module.exports = function() {
    this.interval = function (intervalDB, infTimerDB, client, currTime) {
        //Todo: code for background task
        return interval(intervalDB, infTimerDB, client, currTime);
    }
}

async function interval (intervalDB, infTimerDB, client, currTime) {
    if (global.nextIntervalRun === -1) {
        return;
    }
    
    if (parseInt(global.nextIntervalRun) <= parseInt(currTime)) {
        var intervalList_dbkey = "interval_listing";
        var intervalList = await intervalDB.get(intervalList_dbkey);
        var currentIntervalRun;

        if (intervalList != undefined) {
            intervalList = JSON.parse(intervalList);
        }
        
        if (Array.isArray(intervalList)) {
            if (intervalList.length > 0) {
                currentIntervalRun = intervalList[0];
                intervalList.shift();

                if(intervalList.length > 0) {
                    global.nextIntervalRun = intervalList[0];
                } else {
                    global.nextIntervalRun = -1;
                }
                await intervalDB.set(intervalList_dbkey, JSON.stringify(intervalList));
            } else {
                global.nextIntervalRun = -1;
                return;
            }
        } else {
            intervalList = [];
            await intervalDB.set(intervalList_dbkey, JSON.stringify(intervalList));
            return;
        }

        var interval_dbkey = currentIntervalRun + "_interval";
        var intervalContent = await intervalDB.get(interval_dbkey);
        
        if (intervalContent != undefined) {
            intervalContent = JSON.parse(intervalContent);
        }

        if (Array.isArray(intervalContent)) {
            var i;
            for (i = 0; i < intervalContent.length; i++) {
                var intervalData = intervalContent[i];
                if (intervalData.caller === 'inftimer') {
                    infTimerInterval(infTimerDB, client, currTime, intervalData.data);
                }
                if (intervalData.caller === 'console') {
                    console.log(intervalData.data + " " + currTime);
                }
            }
            await intervalDB.delete(interval_dbkey);
        }
    }
}