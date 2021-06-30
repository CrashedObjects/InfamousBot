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
    ret += prefix+"rates copy < from username > < to username > [ multiplier. Default = 1 ]\n";
    ret += prefix+"rates del < username >\n";
    ret += prefix+"rates default < username > [ m (mixed) | o (orbs) | c (crys) | oc (orbs/crys) | t (tets) | delete ]\n";
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

    if (msg[0].toLowerCase() === 'copy') {
        if (msg.length >= 3) {
            var userid_from_user_rates_dbkey = userid + "_" + msg[1] + "_rates";
            var userid_to_user_rates_dbkey = userid + "_" + msg[2] + "_rates";

            var userid_from_user_rates = await ratesDB.get(userid_from_user_rates_dbkey);

            if (userid_from_user_rates === undefined) {
                message.channel.send("Unable to copy rates. No rates found for user: " + msg[1]);
                return;
            }

            var userid_to_user_rates = JSON.parse(userid_from_user_rates);
            var i;
            var multiplier = 1;
            if (!isNaN(msg[3])) {
                multiplier = parseFloat(msg[3]);
            }
            for (i = 0; i < userid_to_user_rates.length; i++) {
                if (!isNaN(userid_to_user_rates[i])) {
                    userid_to_user_rates[i] = Math.round(((userid_to_user_rates[i] * multiplier) + Number.EPSILON) * 100) / 100;
                }
            }

            var userid_list_dbkey = userid + "_list";
            var userid_list = await ratesDB.get(userid_list_dbkey);
            
            if (userid_list != undefined) {
                userid_list = JSON.parse(userid_list);
            }

            if (!Array.isArray(userid_list)) {
                userid_list = [];
            }

            if(userid_list.indexOf(msg[2].toLowerCase()) === -1) {
                userid_list.push(msg[2]);
                userid_list = JSON.stringify(userid_list);
                await ratesDB.set(userid_list_dbkey, userid_list);
            }

            await ratesDB.set(userid_to_user_rates_dbkey, JSON.stringify(userid_to_user_rates));
            message.channel.send("Copied rates from " + msg[1] + " to " + msg[2]);
            message.channel.send(await ratesDB.get(userid_to_user_rates_dbkey));
        } else {
            message.channel.send(ratesHelp(prefix));
        }
        return;
    }

    if (msg[0].toLowerCase() === 'delete' || msg[0].toLowerCase() === 'del') {
        if (msg.length === 2) {
            var userid_del_user_rates_dbkey = userid + "_" + msg[1] + "_rates";
            message.channel.send("Deleting rates for user: " + msg[1]);
            await ratesDB.delete(userid_del_user_rates_dbkey);

            var userid_list_dbkey = userid + "_list";
            var userid_list = await ratesDB.get(userid_list_dbkey);
            
            if (userid_list != undefined) {
                userid_list = JSON.parse(userid_list);
            }

            if (!Array.isArray(userid_list)) {
                userid_list = [];
            }

            if(userid_list.indexOf(msg[1].toLowerCase()) != -1) {
                userid_list.splice(userid_list.indexOf(msg[1].toLowerCase()), 1);
                userid_list = JSON.stringify(userid_list);
                message.channel.send("Updating rates list");
                await ratesDB.set(userid_list_dbkey, userid_list);
            }

            var userid_user_rates_default_output_dbkey = userid + "_" + msg[1] + "_rates_default_output";
            var userid_user_rates_default_output = await ratesDB.get(userid_user_rates_default_output_dbkey);

            if (userid_user_rates_default_output != undefined) {
                await ratesDB.delete(userid_user_rates_default_output_dbkey);
            }
        } else {
            message.channel.send(ratesHelp(prefix));
        }
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
                //message.channel.send(await ratesDB.get(userid_user_rates_dbkey));
                message.channel.send("Setting rates for user: " + msg[1]);
                rates(prefixDB, ratesDB, client, message, userid, chanid, ["get", msg[1]]);
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
            var userid_user_rates_msg = userid_user_rates;

            if(userid_user_rates != undefined) {
                userid_user_rates = JSON.parse(userid_user_rates);
            }

            if (!Array.isArray(userid_user_rates)) {
                message.channel.send("No rates for user " + msg[1]);
                return;
            }
            else {
                var ret = "Rates for " + msg[1] + ":\n";
                ret += "```RS#.....Orbs| Crys| Tets|Mixed\n";
                var i;
                var retArr = [];
                var retArrPush = "";
                for (i = 0; i < userid_user_rates.length; i+=5) {
                    retArrPush = userid_user_rates[i].padEnd(7, ".").replace("RS10", "RS90");
                    retArrPush += (Math.round((userid_user_rates[i+1] + Number.EPSILON) * 100) / 100).toFixed(2).padStart(5, ".") + "|";
                    retArrPush += (Math.round((userid_user_rates[i+2] + Number.EPSILON) * 100) / 100).toFixed(2).padStart(5, ".") + "|";
                    retArrPush += (Math.round((userid_user_rates[i+3] + Number.EPSILON) * 100) / 100).toFixed(2).padStart(5, ".") + "|";
                    retArrPush += (Math.round((userid_user_rates[i+4] + Number.EPSILON) * 100) / 100).toFixed(2).padStart(5, ".") + "\n";
                    retArr.push(retArrPush);
                }
                retArr.sort();
                for (i = 0; i < retArr.length; i++) {
                    ret += retArr[retArr.length-i-1].replace("RS90", "RS10");
                }
                ret += "```";
                message.channel.send(ret);
                //message.channel.send(userid_user_rates_msg);
                return;
            }
        }
        else {
            message.channel.send(ratesHelp(prefix));
            return;
        }
    }

    if (msg[0].toLowerCase() === 'default' || msg[0].toLowerCase() === 'def') {
        if (msg.length === 2) {
            var userid_user_rates_default_output_dbkey = userid + "_" + msg[1] + "_rates_default_output";
            var userid_user_rates_default_output = await ratesDB.get(userid_user_rates_default_output_dbkey);

            if (userid_user_rates_default_output != undefined) {
                message.channel.send("Default output for user '" + msg[1] + "' is " + userid_user_rates_default_output);
            } else {
                message.channel.send("No default output for user '" + msg[1] + "'");
            }
            return;
        }
        if (msg.length === 3) {
            var userid_user_rates_default_output_dbkey = userid + "_" + msg[1] + "_rates_default_output";

            var userid_user_rates_dbkey = userid + "_" + msg[1] + "_rates";
            var userid_user_rates = await ratesDB.get(userid_user_rates_dbkey);
            var userid_user_rates_msg = userid_user_rates;

            if(userid_user_rates != undefined) {
                if (msg[2].toLowerCase() === 'del' || msg[2].toLowerCase() === 'delete') {
                    await ratesDB.delete(userid_user_rates_default_output_dbkey);
                    message.channel.send("Deleted default output for user '" + msg[1] + "'");
                } else {
                    await ratesDB.set(userid_user_rates_default_output_dbkey, msg[2].toLowerCase());
                    message.channel.send("Set default output for user '" + msg[1] + "' to " + msg[2].toLowerCase());
                }
            } else {
                message.channel.send("No such user '" + msg[1] + "'");
                await ratesDB.delete(userid_user_rates_default_output_dbkey);
            }
        }
        return;
    }

    if (msg[0].toLowerCase() === 'calc') {
        if (msg.length >= 4) {
            var userid_user_rates_dbkey = userid + "_" + msg[1] + "_rates";
            var userid_user_rates = await ratesDB.get(userid_user_rates_dbkey);
            var userid_user_rates_default_output_dbkey = userid + "_" + msg[1] + "_rates_default_output";
            var userid_user_rates_default_output = await ratesDB.get(userid_user_rates_default_output_dbkey);

            if ((userid_user_rates_default_output != undefined) && (msg.length % 2 === 0)) {
                msg.push(userid_user_rates_default_output);
            }

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
                    if ((i+1) < msg.length) {
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
                }
                header += " =\n\n";

                orbs = Math.round(orbs);
                crys = Math.round(crys);
                tets = Math.round(tets);
                mixed = Math.round(mixed);
                

                var orbscrysFloor = Math.floor(orbs/2.0);
                var mixedFloor = Math.floor(mixed/3.0);
                var ret = '';
                var retOrbsCrys = '';
                var retOrbs = '';
                var retCrys = '';
                var retTets = '';
                var retMixed = '';
                var retOrbsTets = '';
                var retCrysTets = '';
                var retNewLine = '\nOR\n';

                retOrbsCrys += '**Orbs/Crys: ** ' + orbs + " (" + orbscrysFloor + " each";
                if ( orbs-(orbscrysFloor*2) > 0 ) {
                    retOrbsCrys += " + " + (orbs - (orbscrysFloor*2));
                }
                retOrbsCrys += ")";

                retOrbs += '**Orbs: ** ' + orbs;
                retCrys += '**Crys: ** ' + crys;

                retOrbsTets += '**Orbs: ** ' + Math.floor(orbs/2.0) + '\nAND\n';
                retOrbsTets += '**Tets: ** ' + Math.floor(tets/2.0);

                retCrysTets += '**Crys: ** ' + Math.floor(crys/2.0) + '\nAND\n';
                retCrysTets += '**Tets: ** ' + Math.floor(tets/2.0);

                retTets += '**Tets: ** ' + tets;
                retMixed += '**Mixed: ** ' + mixed + " (" + mixedFloor + " each";

                if ( mixed - (mixedFloor*3) > 0 ) {
                    retMixed += " + " + (mixed - (mixedFloor*3));
                }
                retMixed += ")";
                
                switch(msg[msg.length-1].toLowerCase()) {
                    case 'co':
                    case 'oc':
                        if(ret === '') {
                            ret = retOrbsCrys;
                        } else {
                            ret += retNewLine;
                            ret = retOrbsCrys;
                        }
                        break;
                    case 'ot':
                    case 'to':
                        if(ret === '') {
                            ret = retOrbsTets;
                        } else {
                            ret += retNewLine;
                            ret = retOrbsTets;
                        }
                        break;
                    case 'ct':
                    case 'tc':
                        if(ret === '') {
                            ret = retCrysTets;
                        } else {
                            ret += retNewLine;
                            ret = retCrysTets;
                        }
                        break;
                    case 'o':
                        if(ret === '') {
                            ret = retOrbs;
                        } else {
                            ret += retNewLine;
                            ret = retOrbs;
                        }
                        break;
                    case 'c':
                        if(ret === '') {
                            ret = retCrys;
                        } else {
                            ret += retNewLine;
                            ret = retCrys;
                        }
                        break;
                    case 't':
                        if(ret === '') {
                            ret = retTets;
                        } else {
                            ret += retNewLine;
                            ret = retTets;
                        }
                        break;
                    case 'm':
                        if(ret === '') {
                            ret = retMixed;
                        } else {
                            ret += retNewLine;
                            ret = retMixed;
                        }
                        break;
                    default:
                        if (orbs === crys) {
                            ret = retOrbsCrys;
                        } else {
                            ret = retOrbs;
                            ret += retCrys;
                        }
                        ret += retNewLine;
                        ret += retTets + retNewLine;
                        ret += retMixed;
                }
                
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