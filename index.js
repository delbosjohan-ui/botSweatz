require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites
    ]
});

// Stockage des invitations en mémoire
const invites = new Collection();

client.once('ready', async () => {
    console.log(`✅ Bot en ligne : ${client.user.tag}`);
    
    // Au démarrage, on scanne les invitations de chaque serveur
    client.guilds.cache.forEach(async (guild) => {
        const firstInvites = await guild.invites.fetch().catch(() => new Collection());
        invites.set(guild.id, new Collection(firstInvites.map((inv) => [inv.code, inv.uses])));
    });
});

client.on('guildMemberAdd', async (member) => {
    const guild = member.guild;
    const welcomeChannel = guild.channels.cache.get(process.env.CHANNEL_ID);

    try {
        const newInvites = await guild.invites.fetch();
        const oldInvites = invites.get(guild.id);
        
        // On trouve quelle invitation a été utilisée
        const usedInvite = newInvites.find(inv => inv.uses > (oldInvites.get(inv.code) || 0));
        
        // On met à jour le cache
        invites.set(guild.id, new Collection(newInvites.map((inv) => [inv.code, inv.uses])));

        if (welcomeChannel) {
            if (usedInvite) {
                // LE MESSAGE EXACT DE TON IMAGE
                welcomeChannel.send(`${member} a été invité par **${usedInvite.inviter.username}** qui a maintenant **${usedInvite.uses} inv** :zapp:`);
            } else {
                welcomeChannel.send(`${member} a rejoint, mais je n'ai pas pu trouver qui l'a invité.`);
            }
        }
    } catch (err) {
        console.error("Erreur lors de l'arrivée d'un membre:", err);
    }
});

client.login(process.env.TOKEN);