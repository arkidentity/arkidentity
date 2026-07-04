import Anthropic from '@anthropic-ai/sdk';
import { TRAVIS_VOICE_SYSTEM_PROMPT } from '@/lib/travisVoicePrompt';

// Server-only. Turns raw field material (a Google Recorder transcript, a photo
// caption, or field notes) into a short update draft in Travis's voice.

let client: Anthropic | null = null;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY — AI drafting is unavailable.');
  }
  client ??= new Anthropic({ apiKey });
  return client;
}

export async function draftUpdate(rawMaterial: string): Promise<string> {
  const message = await getClient().messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    system: TRAVIS_VOICE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Here is the raw material from the field. Draft the partner update in Travis's voice.\n\n---\n${rawMaterial.trim()}\n---`,
      },
    ],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  if (!text) throw new Error('The model returned an empty draft.');
  return text;
}
