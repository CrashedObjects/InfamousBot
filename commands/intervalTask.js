const { Client } = require('discord.js');
require('./time.js')();


module.exports = function() {
    this.intervalTask = function (intervalDB, time, caller, data) {
        return intervalTask(intervalDB, time, caller, data);
    }
}

// function to register an interval task
async function intervalTask (intervalDB, time, caller, data) {
    var dict = {
        time: "",
        caller: "",
        data: ""
    };
    
    dict.time = time;
    dict.caller = caller;
    dict.data = data;

    var intervalList_dbkey = "interval_listing";
    var intervalList = await intervalDB.get(intervalList_dbkey);

    if (intervalList != undefined) {
        intervalList = JSON.parse(intervalList);
    } else {
        intervalList = [];
    }

    var interval_dbkey = time + "_interval";
    var intervalContent = [];
    

    if (!Array.isArray(intervalList)) {
        intervalList = [];
    }

    if(intervalList.indexOf(time) === -1) {
        intervalList.push(time);
        intervalList = intervalList.sort();
        global.nextIntervalRun = intervalList[0];
    } else {
        intervalContent = await intervalDB.get(interval_dbkey);
        if (intervalContent != undefined) {
            intervalContent = JSON.parse(intervalContent);
        }
    }

    intervalContent.push(dict);
    
    await intervalDB.set(intervalList_dbkey, JSON.stringify(intervalList));
    await intervalDB.set(interval_dbkey, JSON.stringify(intervalContent));
}