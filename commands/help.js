module.exports = function() {
    this.help = function (message, userid, chanid) {
        var ret = "List of commands:\n";
        ret += "- prefix\n";
        ret += "- afk\n";
        ret += "- back\n";
        ret += "- wsbot\n";
        ret += "- rates\n";
        ret += "\nFor more info, type `[command name] help`";
        message.channel.send(ret);
        return;
    }
}