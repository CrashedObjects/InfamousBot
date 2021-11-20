const Keyv = require('keyv');

const midDB = new Keyv('sqlite://./db.sqlite', {
	table: 'messageIDs',
	busyTimeout: 10000
});


module.exports = function() {
    this.sendMsg = function (message, content) {
        return sendMsg(message, content);
    }
}

async function sendMsg(message, content) {
    var TTL = 10*60*1000; //in milliseconds
    if (content != undefined) {
        var msNow = Date.now();
        var midKey = message.channelId + "_" + message.id;
        var midListingKey = "messageListings";

        var midListing = await midDB.get(midListingKey);

        if (!Array.isArray(midListing)) {
            midListing = [];
        }

        // clean up db for past TTL messages
        if(midListing.length > 0) {
            for (var i = 0; i < midListing.length; i++) {
                var midListingTTL = await midDB.get(midListing[i]);
                midListingTTL = parseInt(midListingTTL[2]);
                
                if (midListingTTL <= msNow) {
                    await midDB.delete(midListing[i]);
                    midListing.splice(i,1);
                }
            }
            await midDB.set(midListingKey, midListing);
        }
        

        var old_mid = await midDB.get(midKey);
        if (old_mid != undefined) {
            // edit old message
            var msg = await message.channel.messages.fetch(old_mid[1]);
            msg.edit(content);
            await midDB.set(midKey, [msg.channelId, msg.id, msNow + TTL]);
        } else {
            //send new message and save listing to db lookup table
            var mid = await message.channel.send(content);
            await midDB.set(midKey, [message.channelId, mid.id, msNow + TTL]);
            midListing.push(String(midKey));
            
            await midDB.set(midListingKey, midListing);
        }
    }
    return;
}