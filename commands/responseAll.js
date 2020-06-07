const Discord = require('discord.js');
const Keyv = require('keyv');

const afkDB = new Keyv('sqlite://./db.sqlite', {
	table: 'afk',
	busyTimeout: 10000
});

module.exports = function() {
    this.userMentionedResponse = function (userid, chanid, msg, deleteTimeDelay) {
        return respondAFK(userid, chanid, msg, deleteTimeDelay);
    }

    this.roleMentionedResponse = function (msg) {
        return "role mentioned";
    }
}

async function set(dbkey, value) {
    await afkDB.set(dbkey, value);
}

async function get(dbkey) {
    return await afkDB.get(dbkey);
}

function respondAFK(userid, chanid, msg, deleteTimeDelay) {
    // find out if there's actually someone mentioned who is AFK. Sort into members vs non-members
    var memberafk = [];
    var usermentionregex = /<@!?\d+>/g;
    msg.match(usermentionregex).forEach(usermention => {
        var afkuser = usermention;
        var afk_notify_expiry_time_dbkey = afkuser + "_" + chanid + "_afk_notify_expiry_time";
        if (get(afk_notify_expiry_time_dbkey) === undefined) {
            set(afk_notify_expiry_time_dbkey, 0);
        }

        var afkuser_afk_dbkey = afkuser + "_afk";
        var afkuser_afk = get(afkuser_afk_dbkey);
        console.log(afkuser_afk);
        if (afkuser_afk.length() && (afkuser != userid) && (get(afk_notify_expiry_time_dbkey) < time("X"))) {
            memberafk.push(afkuser);
            set(afk_notify_expiry_time_dbkey, time("X") + deleteTimeDelay);
        }
    });

    // exit early if there are no AFK users mentioned
    if (memberafk.length === 0) { return; }

    //build the messages for replies or DMs as needed
    var now = time("X");

    var description = "";
    memberafk.forEach(uid => {
        var afkX = "UserAFK";
        description = afkX;
    });

    var embed = new Discord.MessageEmbed()
        .setColor('yellow')
        .setTitle('AFK Alert for the following members:')
        .setDescription(description);
}



/*
{execcc;bgdelmsg;{get;deleteTimeDelay};{channelid};{send;{channelid};{embedbuild;
  title:AFK Alert for the following members\:;
  color:yellow;
  description: {foreach;~uid;{get;~memberafk};{set;~afkX;{time;X;{get;_{get;~uid}_afk}}}{set;~ago;{trim;{execcc;timediff;twodivs;{get;~now};{get;~afkX}}}}{usernick;{get;~uid}} is AFK and {if;{math;-;{get;~now};{get;~afkX}};<;0;will return **in {get;~ago}**.;said they'd return **{get;~ago} ago**.}{if;{length;{get;_{get;~uid}_afk_msg}};{newline} {zws} {zws} Reason: {substring;{get;_{get;~uid}_afk_msg};0;100}{if;{length;{get;_{get;~uid}_afk_msg}};>;100;{set;~addfooter;1}...}}{newline}};
  {if;{get;~addfooter};==;1;footer.text: Use !seen <username> to view user's full AFK reason}
  ;
}}}*/