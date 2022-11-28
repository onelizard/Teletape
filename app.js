const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const fs = require("fs");

// Проверяем пройдена ли авторизация
if (!fs.existsSync("./my.session")) {
  throw Error("Log in through the login.js file");
}

// Чат в который надо пересылать
let tape_id = null;

// Получаем сессию из файла
const session = fs.readFileSync("./my.session", "utf8");

// Черный список каналов
const blackjson = fs.readFileSync("./blacklist.json", "utf8");
let blacklist = JSON.parse(blackjson);

// Настройки приложения
const apiId = 20825636;
const apiHash = "343c510f28a3fd586cc5feda3a05dd7e";
const stringSession = new StringSession(session); // fill this later with the value from session.save()
const client = new TelegramClient(stringSession, apiId, apiHash, {
  useWSS: true,
});

// Храним групповые сообщения
const groupedMessages = new Map();

// Запуск программы
const start = async () => {
  console.log(
    "Отправьте команду /mytape в канал, который хотите сделать новостным."
  );
  console.log("Send /mytape to the channel you want to make a newsfeed.");
  await client.connect();
  await client.getMe();
  client.addEventHandler(newUpdate, new NewMessage({}));
};

// Новое обновление на аккаунте
const newUpdate = async (update) => {
  // Объект сообщения
  const message = update.message;

  // Если сообщение из канала
  if (message.peerId.className != "PeerChannel") return;

  // Переменные
  const message_id = message.id;
  const peer_id = getPeerID(message.peerId);
  const groupedId = message.groupedId;

  // Пороверки
  if (message.message == "/mytape") return setTape(peer_id);
  if (message.message == "/ignore" && tape_id)
    return ignore(message.replyTo, message.peerId);
  if (!message.peerId) return error(update);
  if (!peer_id || !message_id || !tape_id) return error(update);
  if (message.fromId) return error(update);

  // Есть ли канал в черном списке
  const black = await isBlack(message.peerId);
  if (black) return error(update);

  // Отаправляем сообщение
  await sendMessages(message.peerId, message_id, tape_id, groupedId);
};

const ignore = async (reply_msg, peer_id) => {
  if (!reply_msg) return;
  const msg_id = reply_msg.replyToMsgId;
  await getMsg(msg_id, peer_id);
};

const getMsg = async (msg_id, channel) => {
  const result = await client.invoke(
    new Api.channels.GetMessages({
      channel,
      id: [msg_id],
    })
  );

  const msg = result.messages[0];
  if (!msg || !result.messages[0].peerId) return;
  const fwdFrom = msg.fwdFrom;
  if (fwdFrom.fromId.className != "PeerChannel") return;
  const peer_id = fwdFrom.fromId.channelId.value;

  setBlacklist(peer_id);

  const randomId = rand(1000000, 1000000000);

  await client.invoke(
    new Api.messages.SendMessage({
      peer: channel,
      message: `News from this channel will no longer appear.`,
      randomId: randomId,
    })
  );
};

const setBlacklist = (peer_id) => {
  const blackfile = fs.readFileSync("./blacklist.json", "utf8");
  const blacklist = JSON.parse(blackfile);
  blacklist.push(peer_id + "");
  fs.writeFileSync("./blacklist.json", JSON.stringify(blacklist));
};

// Отправка сообщений
const sendMessages = async (peerId, message_id, tape_id, groupedId) => {
  // Когда сообщение не групповое
  if (groupedId == null)
    return await sendMessage(peerId, [message_id], tape_id);

  // Получаем числовой идентификатор группы
  const groupID = groupedId.value;

  // Когда группа уже создана
  if (groupCreated(groupID))
    return pushGroup(peerId, message_id, tape_id, groupID);

  // Когда нужно создать новую группу
  return newGroup(peerId, message_id, tape_id, groupID);
};

// Проверяем есть ли группа
const groupCreated = (groupID) => {
  return groupedMessages.has(groupID);
};

// Добавляем в группу сообщение
const pushGroup = (peerId, message_id, tape_id, groupID) => {
  const messages = groupedMessages.get(groupID);

  // Очищаем таймер
  clearTimeout(messages.timer);

  // Добавляем ID сообщения
  messages.list.push(message_id);

  // Ставим таймер если ничего не поступило
  messages.timer = setTimeout(async () => {
    await sendMessage(peerId, messages.list, tape_id);
  }, 3000);

  // Сохраняем значение
  groupedMessages.set(groupID, messages);
};

// Создаем группу
const newGroup = (peerId, message_id, tape_id, groupID) => {
  // Создаем массив для группы
  const messages = { list: [message_id] };

  // Ставим таймер если ничего больше не поступило
  messages.timer = setTimeout(async () => {
    await sendMessage(peerId, messages.list, tape_id);
  }, 3000);

  // Сохраняем значение
  groupedMessages.set(groupID, messages);
};

// Отправляем сообщение
const sendMessage = async (peerId, message_ids, tape_id) => {
  // Генерируем random_id для сообщений
  const randomIds = message_ids.map(() => rand(1000000, 10000000000));

  // Отправляем сообщение
  try {
    await client.invoke(
      new Api.messages.ForwardMessages({
        fromPeer: peerId,
        id: message_ids,
        randomId: randomIds,
        toPeer: tape_id,
      })
    );
  } catch (error) {
    console.log(error);
  }
};

// Установить канал для сброса туда постов
const setTape = async (peer_id) => {
  try {
    tape_id = peer_id;
    const randomId = rand(1000000, 1000000000);

    await client.invoke(
      new Api.messages.SendMessage({
        peer: peer_id,
        message: `The news channel is set!`,
        randomId: randomId,
      })
    );

    console.log("Peer_id:", peer_id);
  } catch (error) {
    console.log(error);
  }
};

// Функция выводящая ошибку
const error = (update) => {
  console.log(update);
};

// Получить ID диалога
const getPeerID = (peer) => {
  return peer.channelId;
};

// Находится ли диалог в черном списке
const isBlack = async (peer_id) => {
  updateBlacklist();
  if (blacklist.indexOf(peer_id.channelId.value + "") !== -1) return true;
  return false;
};

// Обновить черный список
const updateBlacklist = () => {
  const blackfile = fs.readFileSync("./blacklist.json", "utf8");
  blacklist = JSON.parse(blackfile);
  return blacklist;
};

// Получить диалог
const getPeer = async (peer_id) => {
  const result = await client.invoke(
    new Api.channels.GetChannels({
      id: [peer_id],
    })
  );
  return result.chats[0];
};

// Генерация случайного числа
const rand = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Запускаем программу
start();
