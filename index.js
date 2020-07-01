require('dotenv').config();
// Database
const Mongoose = require("mongoose");
Mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Discord Jazz
const Discord = require('discord.js');
var client = new Discord.Client();
client.db = Mongoose.connection;
client.db.on('error', console.error.bind(console, 'connection error:'));
client.commands = [];
client.punches = {};
client.config = require('./config.json');

// Command Setup
const fs = require("fs");
fs.readdir("./commands/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    if (!file.endsWith(".js")) return;
    let cmd = require(`./commands/${file}`);
    let command = new cmd();
    console.log(`Loaded command ${command.name}`);
    client.commands.push(command);
  });
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  // Command stuff
  let args = msg.content.split(" ");
  let label = args.shift().slice(1).toLowerCase();
  client.commands.forEach(cmd => {
    if (label === cmd.name || cmd.aliases.includes(label)) {
      cmd.run(client, msg, args, label);
    }
  })
});

client.login(process.env.BOT_TOKEN);