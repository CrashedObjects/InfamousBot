const { Presence } = require('discord.js');
const Keyv = require('keyv');
require('./parseTime.js')();
require('./time.js')();
require('./timeDiff.js')();
require ('./sendMsg.js')();
require ('./intervalTask.js')();

module.exports = function() {
    this.remind = function (prefixDB, remindDB, intervalDB, client, message, userid, chanid, msg) {
        return remind(prefixDB, remindDB, intervalDB, client, message, userid, chanid, msg);
    }

    this.remindInterval = function (remindDB, client, time, data) {
        return remindInterval(remindDB, client, time, data);
    }
}

function help(prefix) {
    var ret;
    ret = "__**Command Name:**__ remind\n";
    ret += "__**Purpose:**__\n";
    ret += "To do";
    return ret;
}

async function remindSendMessage (remindDB, reminder_dbkey, client, message, userid, chanid, content, append) {
    var dict = {
        time: "",
        valid: true,
        userid: "",
        chanid: "",
        mid: "",
        duration: "",
        message: ""
    };

    var reminder = await remindDB.get(reminder_dbkey);

    if (reminder != undefined) {
        reminder = JSON.parse(reminder);
        try {
            await client.channels.cache.get(reminder.chanid).messages.fetch(reminder.mid).then(message => message.reactions.removeAll());
        } catch (e) {
            //console.error(e);
        }
        
    } else {
        reminder = dict;
    }

    if (append) {
        content = reminder.message + content;
    }
    
    //reminder.mid = (await message.channel.send(content)).id;
    reminder.mid = (await (await client.channels.fetch(chanid)).send(content)).id;
    var reminderMsgObj = await client.channels.cache.get(chanid).messages.fetch(reminder.mid);
    reminderMsgObj.react("❌");
    reminderMsgObj.react("♻️");

    return reminder;
}

async function remind (prefixDB, remindDB, intervalDB, client, message, userid, chanid, msg) {
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

    var reminder_dbkey = userid + "_reminder";
    reminder = await infTimerSendMessage(remindDB, reminder_dbkey, client, message, userid, chanid, content);
    
    reminder.chanid = chanid;
    reminder.userid = userid;
    reminder.lastrun = currTime;
    reminder.nextrun = nextRunTime;
    reminder.message = content;

    reminder = JSON.stringify(reminder);
    await remindDB.set(reminder_dbkey, reminder);

    await intervalTask(intervalDB, nextRunTime, "remind", reminder_dbkey);
}

async function remindInterval(remindDB, client, time, data) {
    var reminder = await remindDB.get(data);

    if (reminder != undefined) {
        reminder = JSON.parse(reminder);
    }

    if (parseInt(time) >= parseInt(reminder.time)) {
        var appendMessage = '\n\n<@' + reminder.userid + '> time to run RS before influence loss!';
        
        //reminder = await infTimerAppendMessage ("", remindDB, client, "", reminder.userid, reminder.chanid, appendMessage);
    }
}