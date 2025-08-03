const { Client, GatewayIntentBits, Partials, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once(Events.ClientReady, () => {
  console.log(`Bot ready as ${client.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.content === '!job') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('job_clear')
        .setLabel('✅ Job Clear')
        .setStyle(ButtonStyle.Success)
    );

    await message.channel.send({ content: 'Klik tombol jika kamu menyelesaikan 1 job:', components: [row] });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'job_clear') {
    const streakChannel = interaction.guild.channels.cache.find(c => c.name.includes('streak'));
    const username = interaction.user.username;

    await interaction.reply({ content: `✅ ${username} telah menyelesaikan 1 job!`, ephemeral: true });

    if (streakChannel) {
      streakChannel.send(`🔥 @${username} JOB CLEARED!`);
    }
  }
});

client.login(process.env.TOKEN);