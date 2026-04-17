import { getRelevantHelpDocs } from './helpContextAi';

export function buildSystemPrompt(dataContext?: string, userMessage?: string): string {
  const helpDocs = getRelevantHelpDocs(userMessage ?? '');

  const base = `You are a concise assistant for the Ingram Micro CRM desktop app. Answer using only the reference below. Be brief and direct.

${helpDocs}`;

  if (dataContext) {
    return `${base}

USER DATA:
${dataContext}`;
  }

  return base;
}
