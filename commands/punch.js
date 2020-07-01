const Discord = require("discord.js");
const Punch = require("../punch");
const minRegEX = /\d+m/;
const hourRegEX = /\d+h/;

module.exports = class PunchCommand {
    constructor() {
        this.name = "punch";
        this.description = "Punch into or out of the Time Clock.";
        this.usage = "!punch [user | duration] [duration]";
        this.aliases = ["clockin", "clockout"];
    }
    run(client, message, args) {
        message.delete();
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
            this.sendReport(message, Date.now() - mils, mils);
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
            this.sendReport(message, oTime, totalTime);
        }
    }

    addPunch(id, startTime, length) {
        new Punch({
            id: id,
            date: new Date(startTime),
            length: length,
            description: ""
        }).save();
    }

    sendReport(message, startTime, length) {
        this.addPunch(message.author.id, startTime, length);
        let minutes = Math.ceil(Math.round(length / 1000) / 60);
        let hours = Math.floor(minutes / 60);
        var dString = new Date(startTime - 18000000).toUTCString().split(" ").splice(0, 5);
        let tHour = dString[4].split(":");
        dString.push(tHour[0] / 12 > 0 ? "PM" : "AM");
        tHour[0] = tHour[0] % 12;
        dString[4] = tHour.join(":");
        var report = new Discord.MessageEmbed()
        .setColor(client.config.color)
        .setTitle("Virtual Shift")
        .setDescription(`for ${message.member.nickname}`)
        .addField("Start Time:", `${dString.join(" ")}`)
        .addField("Total Time:", `${hours} hours, ${minutes - hours*60} minutes.`);
        message.channel.send("", {embed: report});
    }
}