const Keyv = require('keyv');
require('./parseTime.js')();
require('./time.js')();
require('./timeDiff.js')();

module.exports = function() {
    this.afk = function (prefixDB, afkDB, client, message, userid, chanid, msg) {
        return afk(prefixDB, afkDB, client, message, userid, chanid, msg);
    }

    this.back = function (prefixDB, afkDB, client, message, userid, chanid, msg, autoresponse) {
        return back(prefixDB, afkDB, client, message, userid, chanid, msg, autoresponse);
    }
}

async function afk (prefixDB, afkDB, client, message, userid, chanid, msg) {
    message.delete({timeout: 5000});
    var timeN = timeNow("X");
    var prefix = await prefixDB.get(message.guild.id);
    var afkchannel = chanid;
    var ret;

    if (msg.length < 1) {
        ret = "__**Command Name:**__ afk\n";
        ret += "__**Usage:**__ "+prefix+"afk <duration> [ reason ]\n\n";
        ret += "To indicate you have returned from AFK, type "+prefix+"back. For more information, type \`"+prefix+"afk help\`";
        message.channel.send(ret);
        return;
    }

    if (msg[0].toLowerCase() === 'help') {
        ret = "__**Usage:**__ "+prefix+"afk <duration> [ reason ]\n\n";
        ret += "Sets your status as being away for a length of time. Durations may be specified in days, hours, minutes, seconds.\n";
        ret += "If a reason is specified, it will be shown in the "+prefix+"seen command.\n\n";
        ret += "Use `"+prefix+"back` to indicate you have returned.\n\n"
        ret += "Examples:\n";
        ret += prefix + "afk 7 hours\n";
        ret += prefix + "afk 2h\n";
        ret += prefix + "afk 30 mins\n";
        ret += prefix + "afk 2h30m\n";
        message.channel.send(ret);
        return;
    }

    var ptargs = "";
    msg.forEach(element => {
        ptargs = ptargs + " " + element;
    });
    var parsetime = parseTime(ptargs);
    var duration;
    var afkmessage = "";
    var longreason = 0;
    if(Array.isArray(parsetime)) {
        duration = parsetime[0];
        if(parsetime[1].length > 500) {
            afkmessage = parsetime[1].substring(0, 500);
            longreason = 1;
        } else {
            afkmessage = parsetime[1];
        }
    } else {
        duration = parsetime;
    }

    if (duration === 0) {
        message.channel.send("Unable to parse your duration properly. Use `"+prefix+"afk help` for usage information.");
        return;
    }

    if (duration > 172800) {
        message.channel.send("Unable to set AFK duration beyond 48h.");
        return;
    }

    var futureunix = parseInt(timeN) + parseInt(duration);
    var time_in_words = timeDiff("fullshort " + parseInt(timeN) + " " + parseInt(futureunix));

    ret = (await client.users.fetch(userid)).username + ", you are marked as AFK for the next " + time_in_words + ".";
    if (afkmessage.length > 0) {
        ret += "Reason: " + afkmessage;
    }
    ret += "\n";
    if(longreason) {
        ret += "\n\nYour AFK reason exceed 500 characters and was truncated";
    }

    var userid_afk_dbkey = userid + "_afk";
    var userid_afk = await afkDB.get(userid_afk_dbkey);
    if(userid_afk != undefined) {
        ret += "\n\nYou previously marked yourself AFK but didn't use `"+prefix+"back` to indicate your return. Your AFK time has been updated.";
    }

    deleteLastAFKMsg(userid);

    var userid_lastafkchanid_dbkey = userid + "_lastafkchanid";
    var userid_lastafkmsgid_dbkey = userid + "_lastafkmsgid";
    var userid_afk_set_dbkey = userid + "_afk_set";
    var userid_afk_dbkey = userid + "_afk";
    var userid_afkmsg_dbkey = userid + "_afk_msg";
    var afklist_dbkey = "afk_list";
    
    await afkDB.set(userid_lastafkchanid_dbkey, afkchannel);
    await afkDB.set(userid_lastafkmsgid_dbkey, (await message.channel.send(ret)).id);
    await afkDB.set(userid_afk_dbkey, futureunix);
    await afkDB.set(userid_afk_set_dbkey, timeN);

    var afklist = await afkDB.get(afklist_dbkey);

    if (!Array.isArray(afklist)) {
        afklist = [];
    }
    if(afklist.indexOf(userid) === -1) {
        afklist.push(userid);
    }
    await afkDB.set(afklist_dbkey, afklist);

    if (afkmessage.length > 0) {
        await afkDB.set(userid_afkmsg_dbkey, afkmessage);
    }

    message.channel.send(ret);
    return;
}

function deleteLastAFKMsg(userid) {
    //TODO: function
}

async function back(prefixDB, afkDB, client, message, userid, chanid, msg, autoresponse) {
    var timeN = timeNow("X");
    var prefix = await prefixDB.get(message.guild.id);
    var threshold = 0.50;
    var afkchannel = chanid;
    var ret;
    var userid_lastafkchanid_dbkey = userid + "_lastafkchanid";
    var userid_lastafkmsgid_dbkey = userid + "_lastafkmsgid";
    var userid_afk_set_dbkey = userid + "_afk_set";
    var userid_afk_dbkey = userid + "_afk";
    var userid_afkmsg_dbkey = userid + "_afk_msg";
    var afklist_dbkey = "afk_list";

    if(msg.length > 1) {
        if (msg[0].toLowerCase() === 'help') {
            ret = "__**Command Name:**__ back\n";
            ret += "__**Usage:**__ "+prefix+"back\n";
            ret += "Manually returns user from AFK.\n"
            ret += "Note: Bot automatically returns user from AFK when user types something in the server after a certain period of time";
            message.channel.send(ret);
            return;
        }
    }

    var backmsg = "";
    var timeX = parseInt(timeNow("X"));
    
    var userid_afk = await afkDB.get(userid_afk_dbkey);
    userid_afk = parseInt(userid_afk);
    var userid_afk_set = await afkDB.get(userid_afk_set_dbkey);
    userid_afk_set = parseInt(userid_afk_set);

    if(autoresponse === undefined) {
        message.delete({timeout: 5000});
        if(userid_afk != undefined && !isNaN(userid_afk)) {
            backmsg += "OK, <@!" + userid + ">, you are no longer marked as being AFK.\n\n";
            backmsg += "You came back ";

            if(parseInt(userid_afk) > timeX) {
                backmsg += "earlier";
            } else {
                backmsg += "later";
            }
            backmsg += " than expected.";
        } else {
            backmsg = "<@!" + userid + ">, you weren't marked as being AFK!";
        }

        deleteLastAFKMsg(userid);
        message.channel.send(backmsg)
            .then(msg => {
                msg.delete({timeout: 30000})
            });
    } else {
        //auto response
        if (userid_afk === undefined) return;
        var diff = parseInt(userid_afk) - parseInt(userid_afk_set);

        if ((userid_afk_set + (diff * threshold)) < timeX) {
            backmsg += "<@!" + userid + ">, you are no longer marked as being AFK.\n\n";
            backmsg += "You came back ";
            if(parseInt(userid_afk) > parseInt(timeX)) {
                backmsg += "earlier";
            } else {
                backmsg += "later";
            }
            backmsg += " than expected.";

            deleteLastAFKMsg(userid);

            message.channel.send(backmsg)
                .then(msg => {
                    msg.delete({timeout: 30000})
                });
        } else {
            return;
        }
    }

    var afklist = await afkDB.get(afklist_dbkey);
    if (Array.isArray(afklist)) {
        if(afklist.indexOf(userid) > -1) {
            afklist.splice(afklist.indexOf(userid),1);
            await afkDB.set(afklist_dbkey, afklist);
        }
    }

    await afkDB.set(userid_lastafkchanid_dbkey, 0);
    await afkDB.set(userid_lastafkmsgid_dbkey, 0);
    await afkDB.delete(userid_afk_dbkey);
    await afkDB.delete(userid_afk_set_dbkey);
    await afkDB.delete(userid_afkmsg_dbkey);
}