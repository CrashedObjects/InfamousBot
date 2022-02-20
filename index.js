const { Client, Intents } = require('discord.js');
const { token } = require('./settings');
const Keyv = require('keyv');
const fs = require('fs');
const inftimer = require('./commands/infTimer');

require ('./commands/parseTime.js')();
require ('./commands/timeDiff.js')();
require ('./commands/responseAll.js')();
require ('./commands/time.js')();
require ('./commands/afk.js')();
require ('./commands/wsbot.js')();
require ('./commands/help.js')();
require ('./commands/rates.js')();
require ('./commands/interval.js')();
require ('./commands/sendMsg.js')();
require ('./commands/infTimer.js')();

const client = new Client({ 
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
	partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});

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

const ratesDB = new Keyv('sqlite://./db.sqlite', {
	table: 'rates',
	busyTimeout: 10000
});

const rosterDB = new Keyv('sqlite://./db.sqlite', {
	table: 'wsroster',
	busyTimeout: 10000
});

const infTimerDB = new Keyv('sqlite://./db.sqlite', {
	table: 'infTimer',
	busyTimeout: 10000
});

const globalPrefix = '.';
const userMentionRegex = /<@!?\d+>/g;
const roleMentionRegex = /<@&!?\d+>/g;

client.on('ready', () => {
	console.log('Ready!');

	// Code for background task executed every minute
/*	var checkminutes = 1, checkthe_interval = checkminutes * 60 * 1000;
	setInterval(async () => {
		await interval(client);
	}, checkthe_interval);*/
});


client.on('messageCreate', async message => {
	if (message.author.bot) return;
    main(message);
});

client.on('messageUpdate', async (old_message, message) => {
	if (message.author.bot) return;
	//only respond to edits done within a certain timeframe
	var TTL = 5*60*1000; //in milliseconds
	
	if (old_message.editedTimestamp != null) {
		TTL = old_message.editedTimestamp + TTL;
	} else {
		TTL = old_message.createdTimestamp + TTL;
	}
	
	if (TTL >= Date.now()){
		main(message);
	}
});

client.on('messageReactionAdd', async (reaction, user) => {
	// When a reaction is received, check if the structure is partial
	if (reaction.partial) {
		// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	// Now the message has been cached and is fully available
	//console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
	// The reaction is now also fully available and the properties will be reflected accurately:
	//console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
	//console.log(user);
	if (user.bot) return;

	// for invoking inftimer via reaction
	if (reaction.emoji.name === "🔴") {
		var userInfTimer_dbkey = user.id + "_inftimer";
		var userInfTimer = await infTimerDB.get(userInfTimer_dbkey);
    	if (userInfTimer != undefined) {
			userInfTimer = JSON.parse(userInfTimer);
			if (userInfTimer.userid === user.id && userInfTimer.chanid === reaction.message.channel.id && userInfTimer.mid === reaction.message.id) {
				await infTimer(prefixDB, infTimerDB, client, reaction.message, user.id, reaction.message.channel.id, "");
			}
		}
	}
});

client.login(token);

async function main(message) {
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
						setTimeout(() => msg.delete(), 600000)
					});
				}
				// empty message. nothing to send
				return;
			}
			if (roleMentionRegex.test(message.content)) {
				return;
				//return message.channel.send(roleMentionedResponse(message.content));
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

	if (command === 'help') {
		help(message, message.author.id, message.channel.id);
	}

    if (command === 'ping') {
		message.channel.send('Loading data').then (async (msg) =>{
			msg.edit(`Latency: ${msg.createdTimestamp - message.createdTimestamp}ms.\nAPI Latency: ${Math.round(client.ws.ping)}ms`);
		  })
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

		var ptRet = parseTime(ptargs);
		if (ptRet != undefined) {
			return message.channel.send(parseTime(ptargs))
				.then(msg => {
					setTimeout(() => msg.delete(), 10000)
				});
		}
	}
	
	if (command === 'timediff') {
		var tdargs = "";
		args.forEach(element => {
			tdargs = tdargs + " " + element;
		});

		var tdRet = timeDiff(tdargs);
		if(tdRet != undefined) {
			return message.channel.send(timeDiff(tdargs))
				.then(msg => {
					setTimeout(() => msg.delete(), 10000)
				});
		}
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

	if(command === 'wsbot') {
		//await wsroster(rosterDB, client, message, message.author.id, message.channel.id, args);
		return message.channel.send("New wsbot coming soon!");
	}

	if(command === 'rates') {
		await rates(prefixDB, ratesDB, client, message, message.author.id, message.channel.id, args);
	}

	if(command === 'inftimer') {
		await infTimer(prefixDB, infTimerDB, client, message, message.author.id, message.channel.id, args);
	}
}