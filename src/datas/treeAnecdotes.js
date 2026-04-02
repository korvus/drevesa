import treeAnecdotes from './treeAnecdotes.json';

const DEFAULT_LANGUAGE = 'fr';
const SUPPORTED_LANGUAGES = new Set(['fr', 'en', 'sl']);

function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.has(language) ? language : DEFAULT_LANGUAGE;
}

export function getLocalizedTreeAnecdote(anecdote, language = DEFAULT_LANGUAGE) {
  if (!anecdote) {
    return null;
  }

  const normalizedLanguage = normalizeLanguage(language);

  return {
    ...anecdote,
    language: normalizedLanguage,
    text: anecdote.text[normalizedLanguage] || anecdote.text[DEFAULT_LANGUAGE] || ''
  };
}

export function getRandomTreeAnecdote(language = DEFAULT_LANGUAGE, excludedIds = []) {
  const excludedIdSet = new Set(excludedIds);
  const availableAnecdotes = treeAnecdotes.filter(({ id }) => !excludedIdSet.has(id));

  if (availableAnecdotes.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableAnecdotes.length);
  return getLocalizedTreeAnecdote(availableAnecdotes[randomIndex], language);
}

export default treeAnecdotes;
