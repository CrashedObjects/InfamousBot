const { Presence } = require('discord.js');
const Keyv = require('keyv');
require('./parseTime.js')();
require('./time.js')();
require('./timeDiff.js')();
require ('./sendMsg.js')();
require ('./intervalTask.js')();

module.exports = function() {
    this.infTimer = function (prefixDB, infTimerDB, intervalDB, client, message, userid, chanid, msg, deleteInvokeCommand) {
        return infTimer(prefixDB, infTimerDB, intervalDB, client, message, userid, chanid, msg, deleteInvokeCommand);
    }

    this.infTimerAppendMessage = function (prefixDB, intervalDB, client, message, userid, chanid, appendMessage) {
        return infTimerAppendMessage(prefixDB, intervalDB, client, message, userid, chanid, appendMessage);
    }

    this.infTimerInterval = function (infTimerDB, client, time, data) {
        return infTimerInterval(infTimerDB, client, time, data);
    }
}

function help(prefix) {
    var ret;
    ret = "__**Command Name:**__ inftimer\n";
    ret += "__**Purpose:**__\n";
    ret += "To track when was the last time an RS was run and calculate 2.5 days after that run to avoid influence loss";
    return ret;
}

async function infTimerSendMessage (infTimerDB, userInfTimer_dbkey, client, message, userid, chanid, content, append) {
    var dict = {
        userid: "",
        chanid: "",
        mid: "",
        lastrun: "",
        nextrun: "",
        message: ""
    };

    var userInfTimer = await infTimerDB.get(userInfTimer_dbkey);

    if (userInfTimer != undefined) {
        userInfTimer = JSON.parse(userInfTimer);
        try {
            await client.channels.cache.get(userInfTimer.chanid).messages.fetch(userInfTimer.mid).then(message => message.delete());
        } catch (e) {
            //console.error(e);
        }
        
    } else {
        userInfTimer = dict;
    }

    if (append) {
        content = userInfTimer.message + content;
    }
    
    //userInfTimer.mid = (await message.channel.send(content)).id;
    userInfTimer.mid = (await (await client.channels.fetch(chanid)).send(content)).id;
    await client.channels.cache.get(chanid).messages.fetch(userInfTimer.mid).then(message => message.react("🔴"));

    return userInfTimer;
}

async function infTimerAppendMessage (prefixDB, infTimerDB, client, message, userid, chanid, appendMessage) {
    var userInfTimer_dbkey = userid + "_inftimer";
    userInfTimer = await infTimerSendMessage(infTimerDB, userInfTimer_dbkey, client, message, userid, chanid, appendMessage, true);

    userInfTimer.chanid = chanid;
    userInfTimer.userid = userid;

    userInfTimer = JSON.stringify(userInfTimer);
    await infTimerDB.set(userInfTimer_dbkey, userInfTimer);
}

async function infTimer (prefixDB, infTimerDB, intervalDB, client, message, userid, chanid, msg, deleteInvokeCommand) {
    if(deleteInvokeCommand){
        setTimeout(() => message.delete(), 5000);
    }

    var prefix = await prefixDB.get(message.guild.id);
    if(msg.length != 0) {
        if ((msg.length != 0) || (msg[0].toLowerCase() === 'help')) {
            sendMsg(message, help(prefix));
            return;
        }
    }

    var currTime = timeNow("X");
    var nextRunTime = parseInt(currTime) + (2.5*24*60*60); // 2.5 days
    var latestNextRunTime = parseInt(currTime) + (3*24*60*60); // 3 days
    var content = (await client.users.fetch(userid)).username + "'s last rs run was <t:" + currTime + ":R>";
    content += "\nNext run must be <t:" + nextRunTime + ":R> (<t:" + nextRunTime + ":F>)";
    content += "\nAbsolute latest run must be <t:" + latestNextRunTime + ":R> (<t:" + latestNextRunTime + ":F>)";

    var userInfTimer_dbkey = userid + "_inftimer";
    userInfTimer = await infTimerSendMessage(infTimerDB, userInfTimer_dbkey, client, message, userid, chanid, content);
    
    userInfTimer.chanid = chanid;
    userInfTimer.userid = userid;
    userInfTimer.lastrun = currTime;
    userInfTimer.nextrun = nextRunTime;
    userInfTimer.message = content;

    userInfTimer = JSON.stringify(userInfTimer);
    await infTimerDB.set(userInfTimer_dbkey, userInfTimer);

    await intervalTask(intervalDB, nextRunTime, "inftimer", userInfTimer_dbkey);
}

async function infTimerInterval(infTimerDB, client, time, data) {
    var userInfTimer = await infTimerDB.get(data);

    if (userInfTimer != undefined) {
        userInfTimer = JSON.parse(userInfTimer);
    }

    if (parseInt(time) >= parseInt(userInfTimer.nextrun)) {
        var appendMessage = '\n\n<@' + userInfTimer.userid + '> time to run RS before influence loss!';
        
        userInfTimer = await infTimerAppendMessage ("", infTimerDB, client, "", userInfTimer.userid, userInfTimer.chanid, appendMessage);
    }
}