async function telegramSendMessage(token, chatId, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/telegram/webhook") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      const update = await request.json();

      if (update.message?.photo && update.message.chat?.id) {
        const photo = update.message.photo;
        const largestPhoto = photo[photo.length - 1];

        await telegramSendMessage(
          env.TELEGRAM_BOT_TOKEN,
          update.message.chat.id,
          `Banner file_id:\n${largestPhoto.file_id}`
        );
      }

      return new Response("OK");
    }

    if (url.pathname === "/") {
      return new Response("Damper Bot V2 online");
    }

    return new Response("Not Found", { status: 404 });
  }
};
