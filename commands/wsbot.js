const Keyv = require('keyv');

module.exports = function() {
    this.wsroster = function (rosterDB, client, message, userid, chanid, msg) {
        return wsroster(rosterDB, client, message, userid, chanid, msg);
    }
}

async function wsroster (rosterDB, client, message, userid, chanid, msg) {
    if (msg.length < 1) {
        ret = "Roster Bot Commands\n";
        ret += "To enter a command, `!wsbot [options] <roles>\n";
        ret += "[] denotes required parameters\n";
        ret += "<> denotes optional parameters\n\n";
        ret += "WS Roles:\n";
        ret += "soldier => follows orders\n";
        ret += "subcommand => not in charge, but helps with command\n";
        ret += "command => in charge of the mission\n";
        ret += "? => No role has been set\n\n";
        ret += "Options\n";
        ret += "join [role] => Join the WS Roster (optionally provide a role)\n";
        //ret += "add @Player [role] => Add one or more players (optionally provide a role)\n";
        ret += "maybe => Join the WS Group as a 'maybe'\n";
        //ret += "addmaybe @Player => Add maybes\n";
        ret += "leave => Leave the WS Group\n";
        ret += "remove @Player => Remove the tagged player(s) from the WS group.\n";
        ret += "remove all => Remove all players in roster\n";
        ret += "remove all maybe => Remove all players in maybe roster\n";
        ret += "role [@Player] role => Assign the given role to the player(s)\n";
        ret += "list => Print a list of players on the roster.\n";
        ret += "help => Print this message.\n";
        message.channel.send(ret);
        return;
    }

    var roster_dbkey = "wsroster_list";
    var roster = await rosterDB.get(roster_dbkey);
    if(!Array.isArray(roster)) {
        roster = [];
    }

    var roster_maybe_dbkey = "wsroster_maybe_list";
    var roster_maybe = await rosterDB.get(roster_maybe_dbkey);
    if(!Array.isArray(roster_maybe)) {
        roster_maybe = [];
    }

    var rosterRoles_prefix_dbkey = "wsroster_role_";

    if(msg[0].toLowerCase() === 'join') {
        if(roster.indexOf(userid) === -1) {
            roster.push(userid);
        }
        if(roster_maybe.indexOf(userid) > -1) {
            roster_maybe.splice(roster_maybe.indexOf(userid),1);
        }
        if (msg.length > 1) {
            if ((msg[1].toLowerCase() === 'soldier') || (msg[1].toLowerCase() === 'command') || (msg[1].toLowerCase() === 'subcommand') || (msg[1].toLowerCase() === '?')) {
                await rosterDB.set(rosterRoles_prefix_dbkey+userid, msg[1].toLowerCase());
            }
        } else {
            await rosterDB.set(rosterRoles_prefix_dbkey+userid, "?");
        }

        await rosterDB.set(roster_dbkey, roster);
        await rosterDB.set(roster_maybe_dbkey, roster_maybe);
        message.channel.send(await list(rosterDB, roster, roster_maybe, rosterRoles_prefix_dbkey));
        return;
    }

    if (msg[0].toLowerCase() === 'maybe') {
        if(roster_maybe.indexOf(userid) === -1) {
            roster_maybe.push(userid);
        }
        if(roster.indexOf(userid) > -1) {
            roster.splice(roster.indexOf(userid),1);
        }

        await rosterDB.set(roster_dbkey, roster);
        await rosterDB.set(roster_maybe_dbkey, roster_maybe);
        await rosterDB.set(rosterRoles_prefix_dbkey+userid, "?");
        message.channel.send(await list(rosterDB, roster, roster_maybe, rosterRoles_prefix_dbkey));
        return;
    }

    if (msg[0].toLowerCase() === 'leave') {
        if(roster.indexOf(userid) > -1) {
            roster.splice(roster.indexOf(userid),1);
        }
        if(roster_maybe.indexOf(userid) > -1) {
            roster_maybe.splice(roster_maybe.indexOf(userid),1);
        }

        await rosterDB.set(roster_dbkey, roster);
        await rosterDB.set(roster_maybe_dbkey, roster_maybe);
        await rosterDB.delete(rosterRoles_prefix_dbkey+userid);
        message.channel.send(await list(rosterDB, roster, roster_maybe, rosterRoles_prefix_dbkey));
        return;
    }

    if (msg[0].toLowerCase() === 'list') {
        message.channel.send(await list(rosterDB, roster, roster_maybe, rosterRoles_prefix_dbkey));
        return;
    }

    if (msg[0].toLowerCase() === 'remove') {
        if (msg.length > 1) {
            if (msg[1].toLowerCase() === 'all') {
                if (msg.length > 2) {
                    if(msg[2].toLowerCase === 'maybe') {
                        roster_maybe = [];
                        await rosterDB.set(roster_maybe_dbkey, roster_maybe);
                    } else {
                        message.channel.send("Unknown command. Please type `!wsbot help` for more info");
                    }
                } else {
                    roster = [];
                    await rosterDB.set(roster_dbkey, roster);
                }
            }
        } else {
            if(roster.indexOf(userid) > -1) {
                roster.splice(roster.indexOf(userid),1);
            }
            if(roster_maybe.indexOf(userid) > -1) {
                roster_maybe.splice(roster_maybe.indexOf(userid),1);
            }

            await rosterDB.set(roster_dbkey, roster);
            await rosterDB.set(roster_maybe_dbkey, roster_maybe);
            await rosterDB.delete(rosterRoles_prefix_dbkey+userid);
        }
    }
}

async function list(rosterDB, roster, roster_maybe, rosterRoles_prefix_dbkey) {
    var i = 0;
    var ret = "("+roster.length+") The following players are joining the White Star.\n";
    var role;
    for (i = 0; i < roster.length; i++) {
        role = "[" + await rosterDB.get(rosterRoles_prefix_dbkey+roster[i]) + "]";
        ret += role.padEnd(15," ");
        ret += roster[i] + "\n";
    }

    ret += "("+roster_maybe.length+") The following players are 'maybe'.\n";
    for (i = 0; i < roster_maybe.length; i++) {
        ret += roster_maybe[i] + "\n";
    }

    return ret;
}

async function add_roster (roster, userid) {
    return roster;
}