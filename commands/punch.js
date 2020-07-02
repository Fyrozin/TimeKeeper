const Discord = require("discord.js");
const Punch = require("../punch");
const minRegEX = /\d+m/;
const hourRegEX = /\d+h/;
const tzFormat = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: 'numeric'
});

module.exports = class PunchCommand {
    constructor() {
        this.name = "punch";
        this.description = "Punch into or out of the Time Clock.";
        this.usage = "!punch [duration] [description]";
        this.aliases = ["clockin", "clockout"];
    }
    run(client, message, args) {
        message.delete();
        message.color = client.config.color;
        var cat = client.channels.cache.get(client.config.clock_category);
        var guild = message.guild;

        // Delete channel if there is one
        cat.children.forEach(c => {
            if (c.name.toLowerCase() === message.member.nickname.toLowerCase()) {
                c.delete();
            }
        });

        let oTime = client.punches[message.member.id];
        if (args[0]) {
            let minutes = args[0].match(minRegEX);
            if (minutes) minutes = +minutes[0].substring(0, minutes[0].length - 1);
            let hours = args[0].match(hourRegEX);
            if (hours) minutes += +hours[0].substring(0, hours[0].length - 1) * 60;
            let mils = minutes * 60 * 1000;
            this.sendReport(message, Date.now() - mils, mils, args.slice(1).join(' '));
            client.punches[message.member.id] = null;
            return;
        }
        if (!oTime) {
            client.punches[message.member.id] = Date.now();
            guild.channels.create(message.member.nickname, {
                type: "voice", 
                parent: client.config.clock_category, 
                permissionOverwrites: [{
                    id: guild.id,
                    allow: 1024,
                    deny: 1048576
                }]
            });
        } else {
            client.punches[message.member.id] = null;
            let totalTime = Date.now() - oTime;
            message.channel.send("Please give a short summary of what you did on your shift (100 words or less)").then(s => {
                var col = message.channel.createMessageCollector(m => m.author.id === message.author.id, { time: 60000 });
                col.on('collect', m => {
                    this.sendReport(message, oTime, totalTime, m.content);
                    m.delete();
                    col.stop();
                });
                col.on('end', e => {
                    s.delete();
                });
            });
        }
    }

    addPunch(id, startTime, length, description) {
        new Punch({
            id: id,
            date: new Date(startTime),
            length: length,
            description: description || ''
        }).save();
    }

    sendReport(message, startTime, length, description) {
        this.addPunch(message.author.id, startTime, length, description);
        let minutes = Math.ceil(Math.round(length / 1000) / 60);
        let hours = Math.floor(minutes / 60);
        var report = new Discord.MessageEmbed()
        .setColor(message.color)
        .setTitle("Virtual Shift")
        .setDescription(`for ${message.member.nickname}`)
        .addField("Start Time:", tzFormat.format(new Date(startTime)))
        .addField("End Time:", tzFormat.format(new Date(startTime + length)))
        .addField("Total Time:", `${hours} hours, ${minutes - hours*60} minutes.`)
        .addField("Description:", description);
        message.channel.send("", {embed: report});
    }
}