const Discord = require('discord.js');
const Keyv = require('keyv');

require('./timeDiff.js')();

module.exports = function() {
    this.userMentionedResponse = function (afkDB, client, message, userid, chanid, msg, deleteTimeDelay) {
        return respondAFK(afkDB, client, message, userid, chanid, msg, deleteTimeDelay);
    }

    this.roleMentionedResponse = function (msg) {
        return "role mentioned";
    }
}


async function respondAFK(afkDB, client, message, userid, chanid, msg, deleteTimeDelay) {
    var debug = true;
    // find out if there's actually someone mentioned who is AFK. Sort into members vs non-members
    var memberafk = [];
    var usermentionregex = /<@!?\d+>/g;

    var i = 0;
    var usermention = msg.match(usermentionregex);
    var afkuser;
    for (i = 0; i < usermention.length; i++) {
        afkuser = usermention[i].replace("<@!", "");
        afkuser = afkuser.replace(">", "");

        var afk_notify_expiry_time_dbkey = afkuser + "_" + chanid + "_afk_notify_expiry_time";

        //await afkDB.set(afk_notify_expiry_time_dbkey, 0);
        var afk_notify_expiry_time = await afkDB.get(afk_notify_expiry_time_dbkey);
        
        if (isNaN(afk_notify_expiry_time) || afk_notify_expiry_time === null) {
            afk_notify_expiry_time = 0;
        }

        var afkuser_afk_dbkey = afkuser + "_afk";
        var afkuser_afk = await afkDB.get(afkuser_afk_dbkey);
        
        if ((afkuser_afk != undefined) && (afkuser != userid) && ((parseInt(afk_notify_expiry_time) < parseInt(timeNow("X"))) || debug == true)) {
            memberafk.push(afkuser);
            await afkDB.set(afk_notify_expiry_time_dbkey, parseInt(timeNow("X")) + parseInt(deleteTimeDelay));
        }
    }
    // exit early if there are no AFK users mentioned
    if (memberafk.length === 0) { return; }
    
    //build the messages for replies or DMs as needed
    var now = time("X");

    var description = "";
    var i = 0;
    var timeX = parseInt(timeNow("X"));
    for (i = 0; i < memberafk.length; i++) {
        var usernick = (await client.users.fetch(memberafk[i])).username;

        var uid_afk_dbkey = memberafk[i] + "_afk";
        var afkX = await afkDB.get(uid_afk_dbkey);
        afkX = parseInt(afkX);
        var ago = timeDiff("twodivs " + timeX + " " + afkX);
        description += usernick + " is AFK and ";
        if(timeX > afkX) {
            description += "said they'd return **" + ago + " ago**.";
        } else {
            description += "will return **in " + ago + "**";
        }
        var afkmessage_dbkey = memberafk[i] + "_afk_msg";
        var afkmessage = await afkDB.get(afkmessage_dbkey);
        
        if(afkmessage!= undefined) {
            if(afkmessage.length > 0) {
                description += " Reason: " + afkmessage.substring(0, 100);
                if(afkmessage.length > 100) {
                    description += "...";
                }
            }
        }
    }

    var embed = new Discord.MessageEmbed()
        .setColor('#ffc44f')
        .setTitle('AFK Alert for the following members:')
        .setDescription(description);

    message.channel.send({ embeds: [embed] });
    
    return;
}