const { Presence } = require('discord.js');
const Keyv = require('keyv');
require('./parseTime.js')();
require('./time.js')();
require('./timeDiff.js')();
require ('./sendMsg.js')();

module.exports = function() {
    this.infTimer = function (prefixDB, infTimerDB, client, message, userid, chanid, msg) {
        return infTimer(prefixDB, infTimerDB, client, message, userid, chanid, msg);
    }
}

function help(prefix) {
    var ret;
    ret = "__**Command Name:**__ inftimer\n";
    ret += "__**Purpose:**__\n";
    ret += "To track when was the last time an RS was run and calculate 2.5 days after that run to avoid influence loss";
    return ret;
}

async function infTimer (prefixDB, infTimerDB, client, message, userid, chanid, msg) {
    setTimeout(() => message.delete(), 5000);

    var prefix = await prefixDB.get(message.guild.id);
    if(msg.length != 0) {
        if ((msg.length != 0) || (msg[0].toLowerCase() === 'help')) {
            sendMsg(message, help(prefix));
            return;
        }
    }

    var currTime = timeNow("X");
    var nextRunTime = parseInt(currTime) + (2.5*24*60*60); // 2.5 days
    var content = (await client.users.fetch(userid)).username + "'s last rs run was <t:" + currTime + ":R>";
    content += "\nNext run must be <t:" + nextRunTime + ":R> (<t:" + nextRunTime + ":F>)";

    var dict = {
        userid: "",
        chanid: "",
        mid: "",
        lastrun: "",
        nextrun: ""
    };

    var userInfTimer_dbkey = userid + "_inftimer";
    var userInfTimer = await infTimerDB.get(userInfTimer_dbkey);
    if (userInfTimer != undefined) {
        userInfTimer = JSON.parse(userInfTimer);
        client.channels.cache.get(userInfTimer.chanid).messages.fetch(userInfTimer.mid).then(message => message.delete());
    } else {
        userInfTimer = dict;
    }

    userInfTimer.mid = (await message.channel.send(content)).id;
    client.channels.cache.get(chanid).messages.fetch(userInfTimer.mid).then(message => message.react("🔴"));
    userInfTimer.chanid = chanid;
    userInfTimer.userid = userid;
    userInfTimer.lastrun = currTime;
    userInfTimer.nextrun = nextRunTime;

    userInfTimer = JSON.stringify(userInfTimer);
    await infTimerDB.set(userInfTimer_dbkey, userInfTimer);
}