const { Client } = require('discord.js');
const { token } = require('./settings');
const Keyv = require('keyv');
const fs = require('fs');

require ('./parseTime.js')();
require ('./timeDiff.js')();

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
		if (!prefix) return;
		args = message.content.slice(prefix.length).split(/\s+/);
	} else {
		// handle DMs
		const slice = message.content.startsWith(globalPrefix) ? globalPrefix.length : 0;
		args = message.content.slice(slice).split(/\s+/);
	}

	// get the first space-delimited argument after the prefix as the command
	const command = args.shift().toLowerCase();

    if (command === 'ping') {
        message.channel.send('gnip');
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

		message.channel.send(parseTime(ptargs))
			.then(msg => {
				msg.delete({timeout: 10000})
			});
	}
	
	if (command === 'timediff') {
		var tdargs = "";
		args.forEach(element => {
			tdargs = tdargs + " " + element;
		});

		message.channel.send(timeDiff(tdargs))
			.then(msg => {
				msg.delete({timeout: 10000})
			});
	}
});

client.login(token);