import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

// Store a single instance to prevent reconnecting on every API call during development
let clientPromise: Promise<TelegramClient> | null = null;

export async function getTelegramClient() {
    if (clientPromise) {
        return clientPromise;
    }

    const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
    const apiHash = process.env.TELEGRAM_API_HASH || "";
    const sessionString = process.env.TELEGRAM_SESSION_STRING || "";

    if (!apiId || !apiHash || !sessionString) {
        throw new Error("Missing Telegram API credentials in environment variables.");
    }

    const stringSession = new StringSession(sessionString);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    clientPromise = client.connect().then(() => {
        console.log("Connected to Telegram successfully.");
        return client;
    });

    return clientPromise;
}
