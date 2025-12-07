
import { ElevenLabsClient } from "elevenlabs";
import dotenv from 'dotenv';
dotenv.config();

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
console.log('Client keys:', Object.keys(client));
if (client.textToSpeech) {
    console.log('textToSpeech keys:', Object.keys(client.textToSpeech));
}
if (client.generate) {
    console.log('generate exists');
} else {
    console.log('generate DOES NOT exist');
}
