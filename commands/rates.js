const { Presence } = require('discord.js');
const Keyv = require('keyv');
require('./parseTime.js')();
require('./time.js')();
require('./timeDiff.js')();

module.exports = function() {
    this.rates = function (prefixDB, ratesDB, client, message, userid, chanid, msg) {
        return rates(prefixDB, ratesDB, client, message, userid, chanid, msg);
    }
}

function ratesHelp(prefix) {
    var ret;
    ret = "__**Command Name:**__ rates\n";
    ret += "__**Usage:**__\n";
    ret += prefix+"rates set < username > < level > < orbs rate > < crystal rate > < tets rate > < mixed rate >\n";
    ret += prefix+"rates get < username >\n";
    ret += prefix+"rates calc < username > [ arts quantity ] [ level ] ...\n";
    ret += prefix+"rates list\n";
    return ret;
}

function parseRSlevel(rs) {
    var rslevel = '';
    if (rs === undefined) {
        return "error";
    }
    if (rs.toLowerCase().startsWith("rs")) {
        rslevel = rs.toUpperCase();
    }
    else {
        rslevel = "RS" + rs;
    }
    return rslevel;
}

async function rates (prefixDB, ratesDB, client, message, userid, chanid, msg) {
    //message.delete({timeout: 5000});
    var timeN = timeNow("X");
    var prefix = await prefixDB.get(message.guild.id);
    var afkchannel = chanid;
    var ret;


    if ((msg.length < 1) || (msg[0].toLowerCase() === 'help')) {
        message.channel.send(ratesHelp(prefix));
        return;
    }

    if (msg[0].toLowerCase() === 'set') {
        if (msg.length === 7) {
            var userid_user_rates_dbkey = userid + "_" + msg[1] + "_rates";
            var userid_user_rates = await ratesDB.get(userid_user_rates_dbkey);
            var new_userid_user_rates = [parseRSlevel(msg[2]), parseFloat(msg[3]), parseFloat(msg[4]), parseFloat(msg[5]), parseFloat(msg[6])];
            if (parseInt(msg[2].toLowerCase().replace("rs", "")) > 0 && parseInt(msg[2].toLowerCase().replace("rs", "")) < 12) {
                var userid_list_dbkey = userid + "_list";
                var userid_list = await ratesDB.get(userid_list_dbkey);
                
                if (userid_list != undefined) {
                    userid_list = JSON.parse(userid_list);
                }

                if (!Array.isArray(userid_list)) {
                    userid_list = [];
                }
                if(userid_list.indexOf(msg[1].toLowerCase()) === -1) {
                    userid_list.push(msg[1]);
                    userid_list = JSON.stringify(userid_list);
                    await ratesDB.set(userid_list_dbkey, userid_list);
                }

                if (userid_user_rates != undefined) {
                    userid_user_rates = JSON.parse(userid_user_rates);
                }

                if (!Array.isArray(userid_user_rates)) {
                    userid_user_rates = [];
                }
                
                var rslevel = parseRSlevel(msg[2]);

                if(userid_user_rates.indexOf(rslevel) === -1) {
                    userid_user_rates.push(parseRSlevel(msg[2]), parseFloat(msg[3]), parseFloat(msg[4]), parseFloat(msg[5]), parseFloat(msg[6]));
                }
                else {
                    userid_user_rates[userid_user_rates.indexOf(rslevel)+1] = parseFloat(msg[3]);
                    userid_user_rates[userid_user_rates.indexOf(rslevel)+2] = parseFloat(msg[4]);
                    userid_user_rates[userid_user_rates.indexOf(rslevel)+3] = parseFloat(msg[5]);
                    userid_user_rates[userid_user_rates.indexOf(rslevel)+4] = parseFloat(msg[6]);
                }
                userid_user_rates = JSON.stringify(userid_user_rates);
                await ratesDB.set(userid_user_rates_dbkey, userid_user_rates)
                message.channel.send(await ratesDB.get(userid_user_rates_dbkey));
            }
            else {
                message.channel.send("No such RS level " + msg[2]);
                message.channel.send(ratesHelp(prefix));
                return;
            }
            
            return;
        }
        else {
            message.channel.send(ratesHelp(prefix));
            return;
        }
    }

    if (msg[0].toLowerCase() === 'get') {
        if (msg.length === 2) {
            var userid_user_rates_dbkey = userid + "_" + msg[1] + "_rates";
            var userid_user_rates = await ratesDB.get(userid_user_rates_dbkey);

            if(userid_user_rates != undefined) {
                userid_user_rates = JSON.parse(userid_user_rates);
            }

            if (!Array.isArray(userid_user_rates)) {
                message.channel.send("No rates for user " + msg[1]);
                return;
            }
            else {
                message.channel.send("Rates for user " + msg[1] + ":\n");
                message.channel.send(userid_user_rates);
                return;
            }
        }
        else {
            message.channel.send(ratesHelp(prefix));
            return;
        }
    }

    if (msg[0].toLowerCase() === 'calc') {
        if (msg.length >= 4) {
            var userid_user_rates_dbkey = userid + "_" + msg[1] + "_rates";
            var userid_user_rates = await ratesDB.get(userid_user_rates_dbkey);

            if (userid_user_rates != undefined) {
                userid_user_rates = JSON.parse(userid_user_rates);
            }

            if (!Array.isArray(userid_user_rates)) {
                message.channel.send("No rates for user " + msg[1]);
                return;
            }
            else {
                var i;
                var orbs = 0.0;
                var crys = 0.0;
                var tets = 0.0;
                var mixed = 0.0;

                var header = '';
                for (i = 2; i < msg.length; i+=2) {
                    var rslevel = parseRSlevel(msg[i+1]);
                    if(rslevel.toLowerCase() === "error") {
                        message.channel.send("Error understanding RS " + msg[i+1]);
                        return;
                    }
                    if(userid_user_rates.indexOf(rslevel) === -1) {
                        message.channel.send("No " + rslevel + " rates found for " + msg[1]);
                        return;
                    }
                    else {
                        var orbsrate = parseFloat(userid_user_rates[userid_user_rates.indexOf(rslevel)+1]);
                        var crysrate = parseFloat(userid_user_rates[userid_user_rates.indexOf(rslevel)+2]);
                        var tetsrate = parseFloat(userid_user_rates[userid_user_rates.indexOf(rslevel)+3]);
                        var mixedrate = parseFloat(userid_user_rates[userid_user_rates.indexOf(rslevel)+4]);

                        orbs += parseFloat(msg[i]) / orbsrate;
                        crys += parseFloat(msg[i]) / crysrate;
                        tets += parseFloat(msg[i]) / tetsrate;
                        mixed += parseFloat(msg[i]) /mixedrate;

                        if (header != '') {
                            header += " + ";
                        }
                        header += msg[i]+"x"+rslevel;
                    }
                }
                header += " =\n\n";

                orbs = Math.round(orbs*10)/10;
                crys = Math.round(crys*10)/10;
                tets = Math.round(tets*10)/10;
                mixed = Math.round(mixed*10)/10;
                

                var ret = '';
                if (orbs === crys) {
                    ret += '**Orbs/Crys: ** ' + orbs + " (" + Math.round(orbs/2.0*10)/10 + " each)\nOR\n";
                }
                else {
                    ret += '**Orbs: ** ' + orbs + "\nOR\n";
                    ret += '**Crys: ** ' + crys + "\nOR\n";
                }
                ret += '**Tets: ** ' + tets + "\nOR\n";
                ret += '**Mixed: ** ' + mixed + " (" + Math.round(mixed/3.0*10)/10 + " each)";

                message.channel.send(header + ret);

                return;
            }
        }
        else {
            message.channel.send(ratesHelp(prefix));
            return;
        }
    }

    if (msg[0].toLowerCase() === 'list') {
        var userid_user_list_dbkey = userid + "_list";
        var userid_user_list = await ratesDB.get(userid_user_list_dbkey);

        if (userid_user_list != undefined) {
            userid_user_list = JSON.parse(userid_user_list);
        }

        if (!Array.isArray(userid_user_list)) {
            message.channel.send("No rates saved");
            return;
        }
        else {
            message.channel.send("List of rates:\n");
            message.channel.send(userid_user_list);
            return;
        }
    }
}