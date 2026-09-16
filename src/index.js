const BANNER_FILE_ID =
  "AgACAgQAAxkBAAMIaqrLcsPcHMx7oPIUstU4FEnr7UYAAuEYaxsFs1lRZUeHg_eeON4BAAMCAAN5AAM9BA";

const MEME_CHANNEL = "@nah_idmeme";
const UPDATE_CHANNEL = "@Updamper_bot";

async function telegramApi(token, method, body) {
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

async function sendMessage(token, chatId, text, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown"
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  await telegramApi(token, "sendMessage", body);
}

async function sendPhoto(token, chatId, photo, caption, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: "Markdown"
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  await telegramApi(token, "sendPhoto", body);
}

async function editMessage(token, chatId, messageId, text, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "Markdown"
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  await telegramApi(token, "editMessageText", body);
}

async function answerCallback(token, callbackQueryId, text = "") {
  await telegramApi(token, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text
  });
}

async function checkMembership(token, channel, userId) {
  const response = await telegramApi(token, "getChatMember", {
    chat_id: channel,
    user_id: userId
  });

  const data = await response.json();

  if (!data.ok) {
    return false;
  }

  return ["creator", "administrator", "member"].includes(
    data.result?.status
  );
}

function generateDamperId() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

function joinKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🧠 JOIN MEME CHANNEL",
          url: "https://t.me/nah_idmeme"
        }
      ],
      [
        {
          text: "🔥 JOIN UPDATES CHANNEL",
          url: "https://t.me/Updamper_bot"
        }
      ],
      [
        {
          text: "✅ CHECK MEMBERSHIP",
          callback_data: "check_membership"
        }
      ]
    ]
  };
}

function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🎮 GAMES", callback_data: "menu_games" },
        { text: "💰 ECONOMY", callback_data: "menu_economy" }
      ],
      [
        { text: "⚔️ RPG", callback_data: "menu_rpg" },
        { text: "🛒 SHOP", callback_data: "menu_shop" }
      ],
      [
        { text: "🗃️ VAULT", callback_data: "menu_vault" },
        { text: "📊 LEADERBOARD", callback_data: "menu_leaderboard" }
      ],
      [
        { text: "👤 PROFILE", callback_data: "menu_profile" },
        { text: "❓ HELP", callback_data: "menu_help" }
      ]
    ]
  };
}

function backKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "⬅️ BACK", callback_data: "menu_main" }
      ]
    ]
  };
}

const sections = {
  menu_games: {
    title: "🎮 *GAMES*",
    text:
      "Choose a game category.\n\n" +
      "Classic, Brain, Reaction, Social and Penalty games will live here."
  },

  menu_economy: {
    title: "💰 *ECONOMY*",
    text:
      "Manage your Damper Coins.\n\n" +
      "Balance, Daily, Transfers and your economy activity."
  },

  menu_rpg: {
    title: "⚔️ *RPG*",
    text:
      "Enter the Damper RPG.\n\n" +
      "Battle → Earn XP → Level Up → Equip → Become stronger."
  },

  menu_shop: {
    title: "🛒 *SHOP*",
    text:
      "Welcome to the Damper Shop.\n\n" +
      "Cards, Pets, Numbered Items and seasonal content."
  },

  menu_vault: {
    title: "🗃️ *VAULT*",
    text:
      "Your personal collection.\n\n" +
      "Cards, Pets, Numbered Items, Achievements, Titles and RPG Inventory."
  },

  menu_leaderboard: {
    title: "📊 *LEADERBOARD*",
    text:
      "See the players making their mark.\n\n" +
      "Richest, XP, Wins, Games, RPG, Collector and more."
  },

  menu_profile: {
    title: "👤 *PROFILE*",
    text:
      "Your Damper identity.\n\n" +
      "Use /profile to view your account information."
  },

  menu_help: {
    title: "❓ *HELP*",
    text:
      "Need help?\n\n" +
      "Use /help to see available commands and learn how THE DAMPER_BOT works."
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/") {
      const result = await env.DB
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
        )
        .all();

      return new Response(
        JSON.stringify({
          status: "online",
          database: "connected",
          telegram: "configured",
          tables: result.results
        }),
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Telegram webhook
    if (url.pathname === "/telegram/webhook") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      const update = await request.json();

      /*
       * CALLBACK BUTTONS
       */
      if (update.callback_query) {
        const callback = update.callback_query;
        const chatId = callback.message?.chat?.id;
        const messageId = callback.message?.message_id;
        const userId = callback.from?.id;
        const data = callback.data;

        if (data === "check_membership") {
          const memeJoined = await checkMembership(
            env.TELEGRAM_BOT_TOKEN,
            MEME_CHANNEL,
            userId
          );

          const updatesJoined = await checkMembership(
            env.TELEGRAM_BOT_TOKEN,
            UPDATE_CHANNEL,
            userId
          );

          if (memeJoined && updatesJoined) {
            await answerCallback(
              env.TELEGRAM_BOT_TOKEN,
              callback.id,
              "Membership verified!"
            );

            let user = await env.DB
              .prepare("SELECT * FROM users WHERE telegram_id = ?")
              .bind(String(userId))
              .first();

            if (!user) {
              let damperId;

              while (true) {
                damperId = generateDamperId();

                const existing = await env.DB
                  .prepare("SELECT id FROM users WHERE damper_id = ?")
                  .bind(damperId)
                  .first();

                if (!existing) break;
              }

              const createdAt = Math.floor(Date.now() / 1000);

              await env.DB
                .prepare(
                  `INSERT INTO users
                  (telegram_id, username, damper_id, role, created_at)
                  VALUES (?, ?, ?, 'PLAYER', ?)`
                )
                .bind(
                  String(userId),
                  callback.from?.username || null,
                  damperId,
                  createdAt
                )
                .run();

              user = await env.DB
                .prepare("SELECT * FROM users WHERE telegram_id = ?")
                .bind(String(userId))
                .first();

              await env.DB
                .prepare(
                  "INSERT INTO wallets (user_id, balance) VALUES (?, 500)"
                )
                .bind(user.id)
                .run();

              await env.DB
                .prepare(
                  `INSERT INTO xp
                  (user_id, damper_xp, level, rpg_xp, rpg_level)
                  VALUES (?, 0, 1, 0, 1)`
                )
                .bind(user.id)
                .run();
            }

            const wallet = await env.DB
              .prepare("SELECT balance FROM wallets WHERE user_id = ?")
              .bind(user.id)
              .first();

            const xp = await env.DB
              .prepare("SELECT level FROM xp WHERE user_id = ?")
              .bind(user.id)
              .first();

            const coins = wallet?.balance ?? 0;
            const level = xp?.level ?? 1;

            await sendPhoto(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              BANNER_FILE_ID,
              `🔥 *THE DAMPER_BOT V2*

\`SYSTEM ONLINE\`

*PLAYER*
🆔 \`${user.damper_id}\`

*WALLET*
💰 \`${coins}\` Damper Coins

*PROGRESS*
⭐ \`LEVEL ${level}\`

━━━━━━━━━━━━━━

*ACCOUNT READY*

Your journey starts here.

\`/menu\` → Enter the bot`,
              mainMenuKeyboard()
            );
          } else {
            await answerCallback(
              env.TELEGRAM_BOT_TOKEN,
              callback.id,
              "Join both channels first."
            );

            await editMessage(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              messageId,
              `🔒 *ACCESS LOCKED*

You need to join both official channels before entering THE DAMPER_BOT V2.

Join both, then press *CHECK MEMBERSHIP* again.`,
              joinKeyboard()
            );
          }

          return new Response("OK");
        }

        /*
         * MAIN MENU
         */
        if (data === "menu_main") {
          await answerCallback(
            env.TELEGRAM_BOT_TOKEN,
            callback.id
          );

          await editMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            messageId,
            `🔥 *THE DAMPER_BOT V2*

Choose your destination.`,
            mainMenuKeyboard()
          );

          return new Response("OK");
        }

        /*
         * MENU SECTIONS
         */
        if (sections[data]) {
          await answerCallback(
            env.TELEGRAM_BOT_TOKEN,
            callback.id
          );

          await editMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            messageId,
            `${sections[data].title}\n\n${sections[data].text}`,
            backKeyboard()
          );

          return new Response("OK");
        }

        return new Response("OK");
      }

      /*
       * NORMAL MESSAGES
       */
      if (update.message?.chat?.id && update.message?.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text.trim();
        const username = update.message.from?.username || null;

        if (text === "/start") {
          const memeJoined = await checkMembership(
            env.TELEGRAM_BOT_TOKEN,
            MEME_CHANNEL,
            chatId
          );

          const updatesJoined = await checkMembership(
            env.TELEGRAM_BOT_TOKEN,
            UPDATE_CHANNEL,
            chatId
          );

          if (!memeJoined || !updatesJoined) {
            await sendMessage(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              `🔒 *WELCOME TO THE DAMPER_BOT V2*

Access to the bot is currently locked.

Join both official channels below to continue.

After joining, press *CHECK MEMBERSHIP*.`,
              joinKeyboard()
            );

            return new Response("OK");
          }

          let user = await env.DB
            .prepare("SELECT * FROM users WHERE telegram_id = ?")
            .bind(String(chatId))
            .first();

          if (!user) {
            let damperId;

            while (true) {
              damperId = generateDamperId();

              const existing = await env.DB
                .prepare("SELECT id FROM users WHERE damper_id = ?")
                .bind(damperId)
                .first();

              if (!existing) break;
            }

            const createdAt = Math.floor(Date.now() / 1000);

            await env.DB
              .prepare(
                `INSERT INTO users
                (telegram_id, username, damper_id, role, created_at)
                VALUES (?, ?, ?, 'PLAYER', ?)`
              )
              .bind(
                String(chatId),
                username,
                damperId,
                createdAt
              )
              .run();

            user = await env.DB
              .prepare("SELECT * FROM users WHERE telegram_id = ?")
              .bind(String(chatId))
              .first();

            await env.DB
              .prepare(
                "INSERT INTO wallets (user_id, balance) VALUES (?, 500)"
              )
              .bind(user.id)
              .run();

            await env.DB
              .prepare(
                `INSERT INTO xp
                (user_id, damper_xp, level, rpg_xp, rpg_level)
                VALUES (?, 0, 1, 0, 1)`
              )
              .bind(user.id)
              .run();
          }

          const wallet = await env.DB
            .prepare("SELECT balance FROM wallets WHERE user_id = ?")
            .bind(user.id)
            .first();

          const xp = await env.DB
            .prepare("SELECT level FROM xp WHERE user_id = ?")
            .bind(user.id)
            .first();

          const coins = wallet?.balance ?? 0;
          const level = xp?.level ?? 1;

          await sendPhoto(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            BANNER_FILE_ID,
            `🔥 *THE DAMPER_BOT V2*

\`SYSTEM ONLINE\`

*PLAYER*
🆔 \`${user.damper_id}\`

*WALLET*
💰 \`${coins}\` Damper Coins

*PROGRESS*
⭐ \`LEVEL ${level}\`

━━━━━━━━━━━━━━

*ACCOUNT READY*

Your journey starts here.

\`/menu\` → Enter the bot`,
            mainMenuKeyboard()
          );
        }

        if (text === "/menu") {
          await sendMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            `🔥 *THE DAMPER_BOT V2*

Choose your destination.`,
            mainMenuKeyboard()
          );
        }
      }

      return new Response("OK");
    }

    return new Response("Not Found", { status: 404 });
  }
};
