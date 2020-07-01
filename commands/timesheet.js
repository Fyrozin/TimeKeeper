const Discord = require('discord.js');
const Punch = require('../punch');
const fs = require('fs');
var tzFormat = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: 'numeric'
});
tzFormat.fDur = function (dur) {
    let minutes = Math.ceil(Math.round(dur / 1000) / 60);
    let hours = Math.floor(minutes / 60);
    return `${hours} hours, ${minutes - hours * 60} minutes`;
};

module.exports = class TimeSheetCommand {
    constructor() {
        this.name = "timesheet";
        this.description = "Get time reports from starting point to ending point.  If you specify a user, you will get a more detailed report with every punch they have made in the time period.";
        this.usage = "!timesheet [user] [startdate] [enddate]";
        this.aliases = ["timereports", "reports"];
    }
    run(client, message, args) {
        message.delete();
        var user, start, end;
        user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        let inc = user ? 1 : 0;
        start = args[0 + inc] ? new Date(Date.parse(args[0 + inc] + " 00:00 CST")) : new Date(Date.parse('1/1/2000 00:00 CST'));
        end = args[1 + inc] ? new Date(Date.parse(args[1 + inc] + " 00:00 CST")) : new Date(Date.now());
        let search = {
            date: { "$gte": start, "$lt": end }
        };
        if (user) search.id = user.id;
        Punch.find(search, function (err, docs) {
            let writer = fs.createWriteStream("./report.csv");
            if (user) {
                var total = 0;
                writer.write("Start,Duration,Description\n");
                docs.forEach(d => {
                    total += d.length;
                    writer.write(`"${tzFormat.format(new Date(d.date))}","${tzFormat.fDur(d.length)}","${d.description}"\n`);
                });
                writer.write(`"Total Hours:","${tzFormat.fDur(total)}",\n`);
            } else {
                var totals = {}, total = 0;
                var mReport = new Discord.MessageEmbed().setTitle('Total Hours').setFooter('TimeKeeper v1.1');
                mReport.setDescription(`For period \nStarting: ${tzFormat.format(start)}\nEnding: ${tzFormat.format(end)}`);
                mReport.setColor(client.config.color);
                docs.forEach(d => {
                    if (totals[d.id]) {
                        totals[d.id] += d.length;
                    } else {
                        totals[d.id] = d.length;
                    }
                });
                writer.write('Name,"Total Hours"\n');
                for (var id in totals) {
                    total += totals[id];
                    let member = message.guild.members.cache.get(id);
                    writer.write(`"${member.nickname ? member.nickname : member.user.username}","${tzFormat.fDur(totals[id])}"\n`);
                    mReport.addField(member.nickname || member.user.username, tzFormat.fDur(totals[id]));
                }
                message.channel.send(mReport);
                writer.write(`"Total Combined","${tzFormat.fDur(total)}"`);
            }
            writer.close();
            message.channel.send({
                files: [{
                    attachment: './report.csv',
                    name: `${user ? user.nickname : 'report'}.csv`
                }]
            });
        });
    }
}