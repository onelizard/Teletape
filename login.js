const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input"); // npm i input
const fs = require("fs");

const apiId = 20825636;
const apiHash = "343c510f28a3fd586cc5feda3a05dd7e";
const stringSession = new StringSession(""); // fill this later with the value from session.save()

const saveSession = (session) => {
  fs.writeFileSync("./my.session", session);
};

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => await input.text("Please enter your number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () =>
      await input.text("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });

  console.log("You should now be connected.");

  // Saving the session
  const session = client.session.save();
  saveSession(session);
  console.log("Your session was saved: ", session);
  process.exit(1);
})();
