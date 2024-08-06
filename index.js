import { config } from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';
import { google } from 'googleapis';
import { schedule } from 'node-cron';

config(); 



const discordClient = new Client({
  intents: [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds
  ]
});

const youtubeClient = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

let latestVideoId = ''

discordClient.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Failed to login:', error)});



discordClient.on('ready', () => {
  console.log(`O BOT está online, autenticado como :${discordClient.user.tag}!`);
  checkForNewVideos();
  schedule('* * 0 * * *', checkForNewVideos);
});

async function checkForNewVideos() {
  try {
    const response = await youtubeClient.search.list({
     channelId: 'UC_NlEK8l2PHPOi6GnAbyFew',
      order: 'date',
      part: 'snippet',
      type: 'video',
      maxResults: 1,
    }).then(res => res);

    const latestVideo = response.data.items[0];
    

    if (latestVideo?.id?.videoId !== latestVideoId) {
      latestVideoId = latestVideo?.id?.videoId;
      const videoUrl = `https://www.youtube.com/watch?v=${latestVideoId}`;
      const message = `Fala rapaziada, VIDEO NOVO NO CANAL!! ${videoUrl}`;
      const channel = discordClient.channels.cache.get('1268592124966867127');
      channel.send(message + ' @everyone');
    }
  } catch (error) {
    console.error('Erro ao buscar vídeos', error);
  }
}
