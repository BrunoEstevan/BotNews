import { config } from 'dotenv';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { google } from 'googleapis';
import { schedule } from 'node-cron';

config(); 

const discordClient = new Client({
  intents: [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent
  ]
});

const youtubeClient = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

let latestVideoId = '';
const prefix = '!';
const channelId = 'UC_NlEK8l2PHPOi6GnAbyFew';
const discordChannelId = '1268592124966867127';

// Array de mensagens para variar as notificações
const mensagens = [
  "Fala rapaziada, VIDEO NOVO NO CANAL!! ",
  "ACABOU DE SAIR! Novo vídeo no canal: ",
  "Corre que tem conteúdo novo! ",
  "Novidade fresquinha no canal! ",
  "Olha o que acabou de sair do forno: ",
  "Cafeína nova para vocês! "
];

discordClient.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Failed to login:', error)});

discordClient.on('ready', () => {
  console.log(`O BOT está online, autenticado como :${discordClient.user.tag}!`);
  checkForNewVideos();
  // Corrigindo o agendamento para verificar a cada 30 minutos
  schedule('*/30 * * * *', checkForNewVideos);
});

// Função para obter uma mensagem aleatória
function getMensagemAleatoria() {
  const indice = Math.floor(Math.random() * mensagens.length);
  return mensagens[indice];
}

async function checkForNewVideos() {
  try {
    const response = await youtubeClient.search.list({
     channelId: channelId,
      order: 'date',
      part: 'snippet',
      type: 'video',
      maxResults: 1,
    }).then(res => res);

    const latestVideo = response.data.items[0];
    
    if (latestVideo?.id?.videoId !== latestVideoId) {
      latestVideoId = latestVideo?.id?.videoId;
      const videoUrl = `https://www.youtube.com/watch?v=${latestVideoId}`;
      const mensagem = getMensagemAleatoria();
      const channel = discordClient.channels.cache.get(discordChannelId);
      
      // Criando um embed simples para a notificação
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(latestVideo.snippet.title)
        .setURL(videoUrl)
        .setImage(latestVideo.snippet.thumbnails.high.url)
        .setTimestamp();
      
      channel.send({ content: mensagem + videoUrl + ' @everyone', embeds: [embed] });
    }
  } catch (error) {
    console.error('Erro ao buscar vídeos', error);
  }
}

// Sistema de comandos simples
discordClient.on('messageCreate', (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  if (command === 'verificar') {
    message.reply('Verificando novos vídeos...');
    checkForNewVideos();
  } 
  else if (command === 'ajuda') {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Comandos do Bot')
      .setDescription('Lista de comandos disponíveis:')
      .addFields(
        { name: `${prefix}verificar`, value: 'Verifica manualmente se há novos vídeos' },
        { name: `${prefix}ajuda`, value: 'Mostra esta mensagem de ajuda' }
      );
    
    message.reply({ embeds: [embed] });
  }
});
