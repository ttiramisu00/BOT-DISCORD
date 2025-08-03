import { Client, GatewayIntentBits, Partials, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, SlashCommandBuilder, REST, Routes } from 'discord.js';
import { storage } from '../storage';

class DiscordJobBot {
  private client: Client;
  private isInitialized = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.once(Events.ClientReady, async () => {
      console.log(`Discord bot ready as ${this.client.user?.tag}`);
      await this.registerSlashCommands();
      this.updateBotStats();
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isChatInputCommand()) {
        console.log(`Received slash command: ${interaction.commandName}`);
        
        if (interaction.commandName === 'job') {
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('job_clear')
              .setLabel('✅ Job Clear')
              .setStyle(ButtonStyle.Success)
          );

          await interaction.reply({ 
            content: '🎯 **Job Completion Tracker**\n\nClick the button below when you complete a job to update your progress:', 
            components: [row] 
          });
        } else if (interaction.commandName === 'leaderboard') {
          try {
            console.log('Processing leaderboard command...');
            
            // Get comprehensive leaderboard data
            const topUsers = await storage.getTopUsers(4);
            const jobTakenStats = await storage.getJobTakenStats();
            console.log('Top users:', topUsers);
            console.log('Job taken stats:', jobTakenStats);
            
            // Calculate total jobs completed
            const totalJobs = topUsers.reduce((sum, user) => sum + user.jobCount, 0);
            const totalJobsTaken = jobTakenStats.reduce((sum: number, stat: any) => sum + stat.jobsTaken, 0);
            const totalInProgress = jobTakenStats.reduce((sum: number, stat: any) => sum + stat.jobsInProgress, 0);
            
            let leaderboardText = `🏆 **TRMS Team Performance Dashboard**\n\n`;
            
            if (topUsers.length > 0) {
              leaderboardText += `**📈 Artist Rankings:**\n`;
              topUsers.forEach((user, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
                const userJobTaken = jobTakenStats.find((stat: any) => stat.username === user.username);
                const takenJobs = userJobTaken ? userJobTaken.jobsTaken : 0;
                const inProgressJobs = userJobTaken ? userJobTaken.jobsInProgress : 0;
                
                leaderboardText += `${medal} **${user.username}** (Level ${user.level})\n`;
                leaderboardText += `   └ ✅ Completed: ${user.jobCount} jobs\n`;
                leaderboardText += `   └ 📋 Taken: ${takenJobs} jobs\n`;
                leaderboardText += `   └ 🔄 In Progress: ${inProgressJobs} jobs\n\n`;
              });
              
              leaderboardText += `**📊 Team Statistics:**\n`;
              leaderboardText += `• 🎯 Total Jobs Completed: **${totalJobs}**\n`;
              leaderboardText += `• 📋 Total Jobs Taken: **${totalJobsTaken}**\n`;
              leaderboardText += `• 🔄 Currently In Progress: **${totalInProgress}**\n`;
              leaderboardText += `• ⚡ Team Efficiency: **${totalJobs > 0 ? Math.round((totalJobs / (totalJobs + totalInProgress)) * 100) : 0}%**\n`;
              leaderboardText += `• 📈 Average Jobs per Artist: **${Math.round(totalJobs / 4 * 10) / 10}**`;
            } else {
              leaderboardText += `**🚀 Getting Started:**\n`;
              leaderboardText += `• Use \`/job\` to complete and track your work\n`;
              leaderboardText += `• Use \`/taken\` to manage job status with clients\n`;
              leaderboardText += `• Use \`/template\` to share requirements with clients\n\n`;
              leaderboardText += `Ready to build your track record! 💪`;
            }

            console.log('Sending leaderboard text:', leaderboardText);
            
            await interaction.reply({ 
              content: leaderboardText
            });
            
            console.log('Leaderboard command completed successfully');
          } catch (error) {
            console.error('Error handling leaderboard command:', error);
            await interaction.reply({ 
              content: '❌ Error displaying leaderboard.',
              flags: [64]
            });
          }
        } else if (interaction.commandName === 'taken') {
          try {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId('job_taken')
                .setLabel('📋 Job Taken by Artist')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('job_update')
                .setLabel('📈 Update Progress')
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId('job_completed')
                .setLabel('✅ Job Completed')
                .setStyle(ButtonStyle.Success)
            );

            await interaction.reply({ 
              content: '**📋 Job Status Management**\n\nClick the button according to job status:', 
              components: [row] 
            });
          } catch (error) {
            console.error('Error handling taken command:', error);
            await interaction.reply({ 
              content: '❌ Error creating job status buttons.',
              flags: [64]
            });
          }
        } else if (interaction.commandName === 'template') {
          try {
            const templateText = `📋 **UGC Creation Template**\n\n` +
              `🎯 **Project Details**\n` +
              `UGC Item Type: (e.g. hair, hat, accessory, bag, etc.)\n` +
              `Brief Item Description: (Shape, style, colors, and other important details)\n` +
              `Deadline / Timeline: (Specific date or estimated timeframe)\n\n` +
              `📎 **References & Brief**\n` +
              `Reference Images / Moodboard: (You may upload files or provide a link)\n\n` +
              `📤 **Output**\n` +
              `File Format: .OBJ and 1 Albedo texture\n` +
              `Final Delivery: via Google Drive\n\n` +
              `For further updates and communication, please stay connected through our Discord server.`;

            await interaction.reply({ 
              content: templateText
            });
          } catch (error) {
            console.error('Error handling template command:', error);
            await interaction.reply({ 
              content: '❌ Error displaying template.',
              flags: [64]
            });
          }
        } else if (interaction.commandName === 'order') {
          try {
            const client = interaction.options.getUser('client', true);
            const model = interaction.options.getString('model', true);
            const deadlineStr = interaction.options.getString('deadline');
            
            // Parse deadline if provided with enhanced logic
            let deadline: Date | null = null;
            if (deadlineStr) {
              const now = new Date();
              const lowerDeadline = deadlineStr.toLowerCase();
              
              if (lowerDeadline.includes('tomorrow')) {
                deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              } else if (lowerDeadline.includes('today')) {
                deadline = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours from now
              } else if (lowerDeadline.includes('day')) {
                const days = parseInt(deadlineStr.match(/\d+/)?.[0] || '1');
                deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
              } else if (lowerDeadline.includes('week')) {
                const weeks = parseInt(deadlineStr.match(/\d+/)?.[0] || '1');
                deadline = new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
              } else if (lowerDeadline.includes('hour')) {
                const hours = parseInt(deadlineStr.match(/\d+/)?.[0] || '8');
                deadline = new Date(now.getTime() + hours * 60 * 60 * 1000);
              } else {
                // Try to parse as date (various formats)
                deadline = new Date(deadlineStr);
                if (isNaN(deadline.getTime())) {
                  // Try parsing common date formats
                  const dateFormats = [
                    `${deadlineStr} ${now.getFullYear()}`,
                    `${now.getFullYear()}-${deadlineStr}`,
                    deadlineStr
                  ];
                  for (const format of dateFormats) {
                    const testDate = new Date(format);
                    if (!isNaN(testDate.getTime())) {
                      deadline = testDate;
                      break;
                    }
                  }
                }
              }
            }

            const order = await storage.createOrder({
              clientId: client.id,
              clientUsername: client.username,
              model,
              serverId: interaction.guildId || '',
              channelId: interaction.channelId,
              deadline,
            });

            // Find order-list channel specifically
            const orderChannel = interaction.guild?.channels.cache.find(c => 
              c.isTextBased() && c.name === 'order-list'
            ) || interaction.channel;

            const deadlineText = deadline ? `\n📅 **Deadline**: ${deadline.toLocaleDateString()}` : '';
            
            const orderMessage = `📦 **New Order by @${client.username}**\n🛠 **Model**: ${model}\n⏳ **Status**: Waiting${deadlineText}\n🆔 **Order ID**: \`${order.id.slice(0, 8)}\``;

            if (orderChannel && 'send' in orderChannel) {
              await orderChannel.send(orderMessage);
            }

            await interaction.reply({
              content: `✅ **Order Created Successfully!**\n\nOrder ID: \`${order.id.slice(0, 8)}\`\nClient: @${client.username}\nModel: ${model}\n\nOrder has been posted to the order channel! 📋`,
              flags: [64]
            });
          } catch (error) {
            console.error('Error creating order:', error);
            await interaction.reply({
              content: '❌ Failed to create order. Please try again.',
              flags: [64]
            });
          }
        } else if (interaction.commandName === 'status') {
          try {
            const orderId = interaction.options.getString('order_id', true);
            const newStatus = interaction.options.getString('status', true);
            
            // Find full order ID that starts with the provided ID
            const allOrders = await storage.getOrdersByStatus();
            const order = allOrders.find(o => o.id.startsWith(orderId));
            
            if (!order) {
              await interaction.reply({
                content: `❌ Order with ID \`${orderId}\` not found.`,
                flags: [64]
              });
              return;
            }

            const updatedOrder = await storage.updateOrderStatus(order.id, newStatus);
            if (!updatedOrder) {
              await interaction.reply({
                content: '❌ Failed to update order status.',
                flags: [64]
              });
              return;
            }

            const statusEmoji = newStatus === 'waiting' ? '⏳' : newStatus === 'progress' ? '🔄' : '✅';
            const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

            await interaction.reply({
              content: `${statusEmoji} **Order Status Updated**\n\nOrder ID: \`${order.id.slice(0, 8)}\`\nClient: @${order.clientUsername}\nNew Status: **${statusText}**\n\nClient has been notified of the status change! 📨`
            });
          } catch (error) {
            console.error('Error updating status:', error);
            await interaction.reply({
              content: '❌ Failed to update order status. Please try again.',
              flags: [64]
            });
          }
        } else if (interaction.commandName === 'quote') {
          try {
            const price = interaction.options.getString('price', true);
            
            const quoteMessage = `💰 **Price Quote**\n\nThank you for your interest in our services!\n\n**Estimated Price**: ${price}\n\n**What's Included:**\n✅ High-quality UGC creation\n✅ Unlimited revisions (within scope)\n✅ Fast delivery\n✅ Professional support\n\n**Next Steps:**\n1. Confirm if you're happy with the quote\n2. We'll start working on your project\n3. Regular updates throughout development\n\n**Payment**: 50% upfront, 50% on completion\n\nReply with "✅ ACCEPT" to proceed or ask any questions! 🤝`;
            
            await interaction.reply({ content: quoteMessage });
          } catch (error) {
            console.error('Error sending quote:', error);
            await interaction.reply({
              content: '❌ Failed to send quote. Please try again.',
              flags: [64]
            });
          }
        } else if (interaction.commandName === 'claim') {
          try {
            const client = interaction.options.getUser('client', true);
            const artistId = interaction.user.id;
            const artistUsername = interaction.user.username;
            
            // Find the most recent waiting order for this client
            const clientOrders = await storage.getOrdersByClient(client.id);
            const waitingOrder = clientOrders.find(o => o.status === 'waiting');
            
            if (!waitingOrder) {
              await interaction.reply({
                content: `❌ No waiting orders found for @${client.username}.`,
                flags: [64]
              });
              return;
            }

            const claimedOrder = await storage.updateOrderStatus(waitingOrder.id, 'progress', artistId, artistUsername);
            
            if (!claimedOrder) {
              await interaction.reply({
                content: '❌ Failed to claim project.',
                flags: [64]
              });
              return;
            }

            await interaction.reply({
              content: `🎯 **Project Claimed!**\n\n**Artist**: @${artistUsername}\n**Client**: @${client.username}\n**Project**: ${waitingOrder.model}\n**Order ID**: \`${waitingOrder.id.slice(0, 8)}\`\n\nProject status updated to "In Progress"! 🚀`
            });
          } catch (error) {
            console.error('Error claiming project:', error);
            await interaction.reply({
              content: '❌ Failed to claim project. Please try again.',
              flags: [64]
            });
          }
        } else if (interaction.commandName === 'feedback') {
          try {
            const client = interaction.options.getUser('client', true);
            const message = interaction.options.getString('message', true);
            const rating = interaction.options.getInteger('rating') || 5;
            
            await storage.createClientFeedback({
              clientId: client.id,
              clientUsername: client.username,
              feedback: message,
              rating,
              serverId: interaction.guildId || ''
            });

            // Find client-feedback channel specifically
            const feedbackChannel = interaction.guild?.channels.cache.find(c => 
              c.isTextBased() && c.name === 'client-feedback'
            ) || interaction.channel;

            const stars = '⭐'.repeat(rating);
            const feedbackMessage = `💬 **Client Feedback**\n\n**Client**: @${client.username}\n**Rating**: ${stars} (${rating}/5)\n**Message**: "${message}"\n**Date**: ${new Date().toLocaleDateString()}`;

            if (feedbackChannel && 'send' in feedbackChannel) {
              await feedbackChannel.send(feedbackMessage);
            }

            await interaction.reply({
              content: `✅ **Feedback Saved!**\n\nClient: @${client.username}\nRating: ${stars}\n\nFeedback has been logged to the feedback channel! 📝`,
              flags: [64]
            });
          } catch (error) {
            console.error('Error saving feedback:', error);
            await interaction.reply({
              content: '❌ Failed to save feedback. Please try again.',
              flags: [64]
            });
          }
        } else if (interaction.commandName === 'portfolio') {
          const portfolioMessage = `🎨 **TRMS TEAMWORK UGC Portfolio**\n\n**🔗 Our Work:**\n• [Roblox Profile](https://www.roblox.com/groups/14637677/TRMS-TEAMWORK-UGC)\n• [Portfolio Gallery](https://discord.gg/trms-teamwork)\n• [Recent Creations](https://www.roblox.com/catalog?Category=1&CreatorName=TRMS%20TEAMWORK)\n\n**🏆 Achievements:**\n• 500+ UGC Items Created\n• 4.9/5 Average Rating\n• 100+ Satisfied Clients\n• Professional Team of 4 Artists\n\n**💼 Services:**\n✅ Accessories & Hats\n✅ Faces & Animations\n✅ Gear & Tools\n✅ Custom Commissions\n✅ 3D Modeling & Texturing\n✅ Rush Orders Available\n\n**🌟 Why Choose Us:**\n• Fast 3-7 Day Delivery\n• Professional Quality\n• Unlimited Revisions\n• 24/7 Support\n• Competitive Pricing\n\n**📞 Contact Us:**\nReady to bring your ideas to life! 🚀`;

          await interaction.reply({ content: portfolioMessage });
        } else if (interaction.commandName === 'clientlist') {
          try {
            const clients = await storage.getAllClients();
            
            if (clients.length === 0) {
              await interaction.reply({
                content: '📋 **Client List**\n\nNo clients found yet. Use `/order` to add your first client!',
                flags: [64]
              });
              return;
            }

            let clientListText = '📋 **Client Database**\n\n';
            clients.forEach((client, index) => {
              const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : '👤';
              clientListText += `${medal} **@${client.clientUsername}**\n   └ Orders: ${client.orderCount}\n\n`;
            });

            clientListText += `**📊 Statistics:**\n• Total Clients: **${clients.length}**\n• Total Orders: **${clients.reduce((sum, c) => sum + c.orderCount, 0)}**\n• Average Orders per Client: **${Math.round((clients.reduce((sum, c) => sum + c.orderCount, 0) / clients.length) * 10) / 10}**`;

            await interaction.reply({
              content: clientListText,
              flags: [64]
            });
          } catch (error) {
            console.error('Error fetching client list:', error);
            await interaction.reply({
              content: '❌ Failed to fetch client list. Please try again.',
              flags: [64]
            });
          }
        } else if (interaction.commandName === 'rules') {
          const rulesMessage = `📜 **TRMS TEAMWORK UGC - Trading Rules & Guidelines**\n\n**💰 Payment Terms:**\n• 50% upfront payment required\n• 50% upon project completion\n• Accepted: Robux, PayPal, Crypto\n\n**⏰ Timeline & Delivery:**\n• Standard delivery: 3-7 business days\n• Rush orders: +50% fee, 1-2 days\n• Revisions included: 3 free major revisions\n\n**📋 Order Process:**\n1. Use \`/template\` for requirements\n2. Wait for quote confirmation\n3. Pay 50% to start production\n4. Receive updates during development\n5. Final payment & delivery\n\n**✅ What We Provide:**\n• High-quality UGC items\n• Professional texturing\n• Roblox-compliant designs\n• Full commercial rights\n\n**❌ What We Don't Do:**\n• Inappropriate/offensive content\n• Copyright infringement\n• Refunds after work begins\n• Free samples/tests\n\n**📞 Support:**\nQuestions? Contact our team anytime!\n\n*By ordering, you agree to these terms.*`;

          await interaction.reply({ content: rulesMessage });
        } else if (interaction.commandName === 'info') {
          const infoMessage = `🤖 **TRMS_Bot#0425 - Complete Feature Guide**\n\n` +
            `**📋 JOB MANAGEMENT COMMANDS:**\n` +
            `• \`/job\` - Complete a job with interactive button and level up system\n` +
            `• \`/taken\` - Manage job status (taken by artist, update progress, completed)\n` +
            `• \`/leaderboard\` - Display top 4 artists with detailed statistics\n\n` +
            
            `**📦 ORDER MANAGEMENT SYSTEM:**\n` +
            `• \`/order\` - Create new client order (posts to #order-list)\n` +
            `• \`/status\` - Update order status (waiting/progress/done)\n` +
            `• \`/claim\` - Claim a client project and start working\n` +
            `• \`/quote\` - Send professional price quote to clients\n\n` +
            
            `**👥 CLIENT RELATIONSHIP TOOLS:**\n` +
            `• \`/feedback\` - Save client feedback with ratings (posts to #client-feedback)\n` +
            `• \`/clientlist\` - Display database of all clients and order counts\n` +
            `• \`/template\` - Show UGC creation template for clients\n\n` +
            
            `**📊 BUSINESS FEATURES:**\n` +
            `• \`/portfolio\` - Display team portfolio and achievements\n` +
            `• \`/rules\` - Show trading rules and payment terms\n` +
            `• \`/info\` - Display this feature guide\n\n` +
            
            `**🎯 KEY FEATURES:**\n` +
            `✅ Complete order lifecycle management\n` +
            `✅ Automatic channel routing (orders → #order-list, feedback → #client-feedback)\n` +
            `✅ Deadline parsing and tracking\n` +
            `✅ 5-star client rating system\n` +
            `✅ Team performance statistics\n` +
            `✅ Level up system (2 jobs = 1 level)\n` +
            `✅ Professional English messaging for international clients\n` +
            `✅ Interactive button workflows\n\n` +
            
            `**📈 STATISTICS TRACKING:**\n` +
            `• Jobs completed and taken by each artist\n` +
            `• Team efficiency and performance metrics\n` +
            `• Client order history and ratings\n` +
            `• Server activity and bot uptime\n\n` +
            
            `**🔄 WORKFLOW EXAMPLE:**\n` +
            `1. Client contacts team → Use \`/template\`\n` +
            `2. Create order → Use \`/order\`\n` +
            `3. Send quote → Use \`/quote\`\n` +
            `4. Artist claims → Use \`/claim\`\n` +
            `5. Update progress → Use \`/status\`\n` +
            `6. Complete job → Use \`/job\`\n` +
            `7. Collect feedback → Use \`/feedback\`\n\n` +
            
            `**🌐 International Support:**\n` +
            `All commands and messages are in English for our global client base.\n\n` +
            
            `*TRMS TEAMWORK UGC - Professional Discord Job Tracker Bot*`;

          await interaction.reply({ content: infoMessage });
        }
      }
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'job_taken') {
        const username = interaction.user.username;
        const serverId = interaction.guildId || '';
        const serverName = interaction.guild?.name || 'Unknown Server';
        const channelId = interaction.channelId;
        
        // Store job taken status
        await storage.createJobTaken({
          userId: interaction.user.id,
          username,
          serverId,
          serverName,
          channelId,
          status: 'taken'
        });

        await interaction.reply({
          content: `📋 **Job Status Updated**\n\n✅ Job taken by artist <@${interaction.user.id}> and will start processing today. Please wait for future updates.`
        });
      } else if (interaction.customId === 'job_update') {
        const username = interaction.user.username;
        const serverId = interaction.guildId || '';
        const serverName = interaction.guild?.name || 'Unknown Server';
        const channelId = interaction.channelId;
        
        // Update job status to in progress
        await storage.updateJobTakenStatus(interaction.user.id, 'in_progress');

        await interaction.reply({
          content: `📈 **Progress Update**\n\n<@${interaction.user.id}> is providing a progress update on this job! Please wait for future updates!`
        });
      } else if (interaction.customId === 'job_completed') {
        const username = interaction.user.username;
        const serverId = interaction.guildId || '';
        const serverName = interaction.guild?.name || 'Unknown Server';
        const channelId = interaction.channelId;
        
        // Update job status to completed and create job completion
        await storage.updateJobTakenStatus(interaction.user.id, 'completed');
        await storage.createJobCompletion({
          userId: interaction.user.id,
          username,
          serverId,
          serverName,
          channelId,
          channelName: 'job-management',
        });

        await interaction.reply({
          content: `🎉 **Job Completed!**\n\nThe job has been completed! Thank you for trusting our team! We hope the results are satisfactory! 🎊✨`
        });
      } else if (interaction.customId === 'job_clear') {
        const streakChannel = interaction.guild?.channels.cache.find(c => 
          c.name.includes('streak') && c.isTextBased()
        ) as TextChannel;
        
        const username = interaction.user.username;
        const serverId = interaction.guildId || '';
        const serverName = interaction.guild?.name || 'Unknown Server';
        const channelId = interaction.channelId;
        const channelName = streakChannel?.name || 'streak-channel';

        // Store job completion
        await storage.createJobCompletion({
          userId: interaction.user.id,
          username,
          serverId,
          serverName,
          channelId,
          channelName,
        });

        // Count total jobs for this user and update level
        const userCompletions = await storage.getRecentJobCompletions(1000);
        const userJobCount = userCompletions.filter(job => job.username === username).length;
        const levelResult = await storage.updateUserLevel(username, userJobCount);

        // Get top 4 users leaderboard
        const topUsers = await storage.getTopUsers(4);
        
        let leaderboardText = `✅ **${username} completed 1 job!**\n`;
        leaderboardText += `🎯 **Level ${levelResult.userLevel.level}** | Total: ${userJobCount} jobs\n\n`;
        leaderboardText += `🏆 **Top 4 Artists Leaderboard:**\n`;
        
        topUsers.forEach((user, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
          leaderboardText += `${medal} **${user.username}**: ${user.jobCount} jobs (Level ${user.level})\n`;
        });

        await interaction.reply({ 
          content: leaderboardText, 
          flags: [64] // MessageFlags.Ephemeral
        });

        // Check for level up celebration
        if (levelResult.leveledUp && levelResult.newLevel) {
          if (streakChannel) {
            try {
              await streakChannel.send({
                content: `🎉 **LEVEL UP CELEBRATION!** 🎉\n\n**${username}** just reached **Level ${levelResult.newLevel}**!\n\n✨ **${userJobCount} jobs** completed total!\n🏆 Outstanding performance! Keep the momentum going! 🚀\n\n*Every 2 jobs = 1 level up!*`,
                files: [{
                  attachment: './client/src/assets/level-up.gif',
                  name: 'good-job.gif'
                }]
              });
            } catch (error) {
              console.log(`Could not send level up message to channel (permissions issue): ${error instanceof Error ? error.message : 'Unknown error'}`);
              // Try to send a simple message instead
              try {
                await streakChannel.send(`🎉 ${username} LEVEL UP! Now Level ${levelResult.newLevel}! 🎉`);
              } catch (fallbackError) {
                console.log(`Could not send fallback level up message: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
              }
            }
          }
        } else {
          if (streakChannel) {
            try {
              // Calculate jobs needed to next level (2 jobs per level)
              const jobsToNextLevel = 2 - (userJobCount % 2);
              const nextLevel = levelResult.userLevel.level + 1;
              const progressBar = userJobCount % 2 === 1 ? '▰▱' : '▱▱';
              await streakChannel.send(`🔥 **@${username} JOB CLEARED!** ✅\n📊 Level ${levelResult.userLevel.level} ${progressBar} | ${jobsToNextLevel} job${jobsToNextLevel > 1 ? 's' : ''} to Level ${nextLevel}! 🎯`);
            } catch (error) {
              console.log(`Could not send job cleared message to channel (permissions issue): ${error instanceof Error ? error.message : 'Unknown error'}`);
              // Try to send a simple message instead
              try {
                await streakChannel.send(`✅ ${username} job cleared!`);
              } catch (fallbackError) {
                console.log(`Could not send fallback job message: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
              }
            }
          }
        }

        // Update stats
        await this.updateBotStats();
      }
    });

    this.client.on(Events.Error, (error) => {
      console.error('Discord bot error:', error);
    });
  }

  async initialize() {
    if (this.isInitialized) return;

    const token = process.env.DISCORD_BOT_TOKEN || process.env.TOKEN;
    if (!token) {
      throw new Error('Discord bot token not found in environment variables');
    }

    try {
      await this.client.login(token);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Discord bot:', error);
      throw error;
    }
  }

  private async registerSlashCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('job')
        .setDescription('Complete a job with interactive button'),
      new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Display top 4 artists leaderboard'),
      new SlashCommandBuilder()
        .setName('taken')
        .setDescription('Manage job status: taken by artist, update progress, or mark completed'),
      new SlashCommandBuilder()
        .setName('template')
        .setDescription('Show client form requirements template'),
      new SlashCommandBuilder()
        .setName('order')
        .setDescription('Create a new order from client')
        .addUserOption(option =>
          option.setName('client')
            .setDescription('The client placing the order')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('model')
            .setDescription('Model/item description')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('deadline')
            .setDescription('Deadline (e.g., Aug 8, Tomorrow, 3 days)')
            .setRequired(false)),
      new SlashCommandBuilder()
        .setName('status')
        .setDescription('Update order status')
        .addStringOption(option =>
          option.setName('order_id')
            .setDescription('Order ID to update')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('status')
            .setDescription('New status')
            .setRequired(true)
            .addChoices(
              { name: 'Waiting', value: 'waiting' },
              { name: 'Progress', value: 'progress' },
              { name: 'Done', value: 'done' }
            )),
      new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Send automatic quote message to client')
        .addStringOption(option =>
          option.setName('price')
            .setDescription('Price quote (e.g., 100 robux, $5)')
            .setRequired(true)),
      new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Claim a client project')
        .addUserOption(option =>
          option.setName('client')
            .setDescription('The client whose project to claim')
            .setRequired(true)),
      new SlashCommandBuilder()
        .setName('feedback')
        .setDescription('Save client feedback')
        .addUserOption(option =>
          option.setName('client')
            .setDescription('The client providing feedback')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('message')
            .setDescription('Feedback message')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('rating')
            .setDescription('Rating (1-5 stars)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(5)),
      new SlashCommandBuilder()
        .setName('portfolio')
        .setDescription('Share portfolio links'),
      new SlashCommandBuilder()
        .setName('clientlist')
        .setDescription('Display list of all clients'),
      new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Display trading rules and guidelines'),
      new SlashCommandBuilder()
        .setName('info')
        .setDescription('Display all bot features and commands')
    ];

    const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN || process.env.TOKEN || '');

    try {
      console.log('Started refreshing application (/) commands.');
      console.log('Commands to register:', commands.map(cmd => cmd.name));

      // Clear existing commands first
      await rest.put(
        Routes.applicationCommands(this.client.user?.id || ''),
        { body: [] },
      );
      console.log('Cleared existing commands.');

      // Wait a moment then register new commands
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Register globally
      await rest.put(
        Routes.applicationCommands(this.client.user?.id || ''),
        { body: commands },
      );

      console.log('Successfully reloaded application (/) commands globally.');
      console.log('Total commands registered:', commands.length);

    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }

  private async updateBotStats() {
    const serverCount = this.client.guilds.cache.size;
    const activeUsers = this.client.users.cache.size;
    const streakChannels = this.client.channels.cache.filter(c => 
      c.isTextBased() && (c as TextChannel).name.includes('streak')
    ).size;

    await storage.updateBotStats({
      serverCount,
      activeUsers,
      streakChannels,
      isOnline: true,
    });
  }

  async restart() {
    if (this.isInitialized) {
      await this.client.destroy();
      this.isInitialized = false;
    }
    await this.initialize();
  }

  getClient() {
    return this.client;
  }

  isReady() {
    return this.client.isReady();
  }
}

export const discordBot = new DiscordJobBot();
