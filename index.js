const { Client } = require('discord.js');
const { token } = require('./settings');
const Keyv = require('keyv');
const fs = require('fs');

require ('./commands/parseTime.js')();
require ('./commands/timeDiff.js')();
require ('./commands/responseAll.js')();
require ('./commands/time.js')();
require ('./commands/afk.js')();

const client = new Client();

const dbPath = './db.sqlite';

try {
	if (!fs.existsSync(dbPath)) {
		fs.writeFileSync(dbPath, "", function (err) {
			if (err) throw err;
		});
		console.log(dbPath + "doesn't exist. Creating file");
	} 
}
catch (e) {
	console.log(e);
}

const prefixDB = new Keyv('sqlite://./db.sqlite', {
	table: 'prefixes',
	busyTimeout: 10000
});

const afkDB = new Keyv('sqlite://./db.sqlite', {
	table: 'afk',
	busyTimeout: 10000
});

const globalPrefix = '.';
const userMentionRegex = /<@!?\d+>/g;
const roleMentionRegex = /<@&!?\d+>/g;

client.on('ready', () => console.log('Ready!'));


client.on('message', async message => {
    if (message.author.bot) return;
	
	let args;
	// handle messages in a guild
	if (message.guild) {
		let prefix;
		
		if (message.content.startsWith(globalPrefix)) {
			prefix = globalPrefix;
		} else {
			// check the guild-level prefix
			const guildPrefix = await prefixDB.get(message.guild.id);
			if (message.content.startsWith(guildPrefix)) prefix = guildPrefix;
		}

		// if we found a prefix, setup args; otherwise, this isn't a command
		if (!prefix) {
			//console.log(await client.user.fetch('<@!718657527067443240>'));
			if (userMentionRegex.test(message.content)) {
				var userMentionedRes = await userMentionedResponse(afkDB, client, message, message.author.id, message.channel.id, message.content, 600);
				//check to make sure message isn't empty. if empty, we ignore it.
				if (userMentionedRes != undefined) {
					return message.channel.send(userMentionedRes)
					.then(msg => {
						msg.delete({timeout: 600000})
					});
				}
				// empty message. nothing to send
				return;
			}
			if (roleMentionRegex.test(message.content)) {
				return message.channel.send(roleMentionedResponse(message.content));
			}

			//everything auto response
			back(prefixDB, afkDB, client, message, message.author.id, message.channel.id, message.content, "autoresponse");
			return;
		}
		args = message.content.slice(prefix.length).split(/\s+/);
	} else {
		// handle DMs
		const slice = message.content.startsWith(globalPrefix) ? globalPrefix.length : 0;
		args = message.content.slice(slice).split(/\s+/);
	}

	// get the first space-delimited argument after the prefix as the command
	const command = args.shift().toLowerCase();

    if (command === 'ping') {
        message.channel.send('pong!');
    }

    if (command === 'prefix') {
        // if there's at least one argument, set the prefix
        if (args.length) {
            await prefixDB.set(message.guild.id, args[0]);
            return message.channel.send(`Successfully set prefix to \`${args[0]}\``);
        }
    
        return message.channel.send(`Prefix is \`${await prefixDB.get(message.guild.id) || globalPrefix}\``);
	}

	if (command === 'parsetime') {
		var ptargs = "";
		args.forEach(element => {
			ptargs = ptargs + " " + element;
		});

		return message.channel.send(parseTime(ptargs))
			.then(msg => {
				msg.delete({timeout: 10000})
			});
	}
	
	if (command === 'timediff') {
		var tdargs = "";
		args.forEach(element => {
			tdargs = tdargs + " " + element;
		});

		return message.channel.send(timeDiff(tdargs))
			.then(msg => {
				msg.delete({timeout: 10000})
			});
	}

	if (command === 'time') {
		return message.channel.send(timeNow(args[0]));
	}

	if(command === 'afk') {
		//return message.channel.send(await afk(prefixDB, afkDB, client, message, message.author.id, message.channel.id, args));
		await afk(prefixDB, afkDB, client, message, message.author.id, message.channel.id, args);
	}

	if(command === 'back') {
		await back(prefixDB, afkDB, client, message, message.author.id, message.channel.id, args);
	}
});

client.login(token);