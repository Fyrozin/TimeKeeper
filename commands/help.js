const Discord = require('discord.js');

module.exports = class HelpCommand {
    constructor() {
        this.name = "help";
        this.description = "Gives a list of commands.";
        this.usage = "!help [command]";
        this.aliases = [];
    }
    run(client, message, args) {
        message.delete();
        var msg = new Discord.MessageEmbed().setColor(client.config.color).setTitle('Help').setFooter('ModularHelp v0.3 | Fyrozin');
        if (!args[0]) {
            msg.setDescription('For more info on a specific command, use\n`!help [command_name]`');
            client.commands.forEach(cmd => {
                msg.addField(cmd.name, cmd.description);
            });
        } else {
            let found = false;
            for (var i in client.commands) {
                let cmd = client.commands[i];
                if (args[0] === cmd.name || cmd.aliases.includes(args[0])) {
                    msg.addField('Name', cmd.name);
                    msg.addField('Description', cmd.description || '\u200b');
                    msg.addField('Usage', cmd.usage || `!${cmd.name}`);
                    msg.addField('Aliases', cmd.aliases.join('\n') || 'none');
                    found = true;
                    break;
                }
            }
            if (!found) {
                msg.addField('Could not find command', args[0]);
            }
        }
        message.channel.send(msg).then(s => s.delete({timeout: 60000}));
    }
}