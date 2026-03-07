require("dotenv").config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
const apiHash = process.env.TELEGRAM_API_HASH;

// Start with an empty session
const stringSession = new StringSession("");

(async () => {
    if (!apiId || !apiHash) {
        console.error("Please set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env");
        process.exit(1);
    }

    console.log("Loading interactive example...");
    console.log(`Using App ID: ${apiId}`);

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text("Please enter your number (with country code, e.g., +201...): "),
        password: async () => await input.text("Please enter your password (if 2FA is enabled): "),
        phoneCode: async () => await input.text("Please enter the code you received from Telegram: "),
        onError: (err) => console.log(err),
    });

    console.log("You should now be connected.");

    // Save this string to your target environment!
    const sessionStr = client.session.save();
    console.log("\n--- YOUR SESSION STRING ---");
    console.log(sessionStr);
    console.log("---------------------------\n");
    console.log("Please copy the string above and save it to your .env file as TELEGRAM_SESSION_STRING");
    process.exit(0);
})();
