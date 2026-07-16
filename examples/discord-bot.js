const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { AkinatorClient, Languages, Themes, Answers } = require("../dist/cjs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const ANSWERS = [Answers.Yes, Answers.No, Answers.IDontKnow, Answers.Probably, Answers.ProbablyNot];
const ANSWER_LABELS = ["Yes", "No", "Don't know", "Probably", "Probably not"];

const games = new Map();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!aki")) return;

  const args = message.content.slice(4).trim().split(" ");
  const subcommand = args[0];

  if (subcommand === "start") {
    const lang = args[1] || "en";
    const themeName = args[2] || "character";

    const themeMap = { character: Themes.Character, animals: Themes.Animals, objects: Themes.Objects };
    const theme = themeMap[themeName.toLowerCase()] || Themes.Character;

    const aki = new AkinatorClient({
      language: lang,
      theme: theme,
      childMode: false,
    });

    try {
      const result = await aki.start();
      games.set(message.author.id, aki);

      const embed = new EmbedBuilder()
        .setTitle("Akinator")
        .setDescription(result.question)
        .setColor(0x9b59b6)
        .setFooter({ text: `Step ${result.step} | ${result.progression.toFixed(1)}%` });

      const row = new ActionRowBuilder();
      ANSWER_LABELS.forEach((label, i) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`aki_${i}`)
            .setLabel(label)
            .setStyle(ButtonStyle.Secondary)
        );
      });

      await message.reply({ embeds: [embed], components: [row] });
    } catch (err) {
      await message.reply(`Error: ${err.message}`);
    }
    return;
  }

  if (subcommand === "save") {
    const aki = games.get(message.author.id);
    if (!aki) return message.reply("No active game.");

    const data = JSON.stringify(aki.toJSON());
    await message.reply(`Your session:\n\`\`\`${data}\`\`\`\nSave this to restore later with \`!aki load\`.`);
    return;
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("aki_")) return;

  const answerIndex = parseInt(interaction.customId.split("_")[1]);
  const aki = games.get(interaction.user.id);

  if (!aki) {
    await interaction.reply({ content: "No active game. Use `!aki start`", ephemeral: true });
    return;
  }

  try {
    const result = await aki.answer(ANSWERS[answerIndex]);

    if (aki.won) {
      const win = aki.winResult;
      const embed = new EmbedBuilder()
        .setTitle("Akinator guessed!")
        .setDescription(`**${win.name}**\n${win.description}`)
        .setColor(0x2ecc71);

      if (win.pictureUrl) embed.setImage(win.pictureUrl);

      const row = new ActionRowBuilder();
      row.addComponents(
        new ButtonBuilder().setCustomId("aki_correct").setLabel("Correct!").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("aki_continue").setLabel("Wrong, continue").setStyle(ButtonStyle.Danger)
      );

      await interaction.update({ embeds: [embed], components: [row] });
      return;
    }

    if (aki.ko) {
      const embed = new EmbedBuilder()
        .setTitle("Akinator gave up!")
        .setDescription("You won! Akinator couldn't guess your character.")
        .setColor(0xe74c3c);

      await interaction.update({ embeds: [embed], components: [] });
      games.delete(interaction.user.id);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Akinator")
      .setDescription(result.question)
      .setColor(0x9b59b6)
      .setFooter({ text: `Step ${result.step} | ${result.progression.toFixed(1)}%` });

    const row = new ActionRowBuilder();
    ANSWER_LABELS.forEach((label, i) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`aki_${i}`)
          .setLabel(label)
          .setStyle(ButtonStyle.Secondary)
      );
    });

    await interaction.update({ embeds: [embed], components: [row] });
  } catch (err) {
    await interaction.update({ content: `Error: ${err.message}`, components: [] });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "aki_correct") {
    const aki = games.get(interaction.user.id);
    if (aki) {
      await aki.submitWin();
      await interaction.update({ content: "Akinator confirmed the win!", components: [] });
      games.delete(interaction.user.id);
    }
    return;
  }

  if (interaction.customId === "aki_continue") {
    const aki = games.get(interaction.user.id);
    if (aki) {
      const result = await aki.continue();
      const embed = new EmbedBuilder()
        .setTitle("Akinator")
        .setDescription(result.question)
        .setColor(0x9b59b6)
        .setFooter({ text: `Step ${result.step} | ${result.progression.toFixed(1)}%` });

      const row = new ActionRowBuilder();
      ANSWER_LABELS.forEach((label, i) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`aki_${i}`)
            .setLabel(label)
            .setStyle(ButtonStyle.Secondary)
        );
      });

      await interaction.update({ embeds: [embed], components: [row] });
    }
    return;
  }
});

client.login("YOUR_BOT_TOKEN");
