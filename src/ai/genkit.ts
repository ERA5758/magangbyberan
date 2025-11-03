import {genkit, Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

let googleAppCreds: any = undefined;

if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    googleAppCreds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON as string);
  } catch (e) {
    console.error(`Unable to parse GOOGLE_APPLICATION_CREDENTIALS_JSON: ${e}`);
  }
}

const plugins: Plugin<any>[] = [googleAI({
  v1: {
    credentials: googleAppCreds,
  }
})];

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.5-flash',
});
