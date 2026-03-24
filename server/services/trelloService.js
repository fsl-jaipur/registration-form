const TRELLO_BASE_URL = "https://api.trello.com/1";

const getEnv = () => {
  const key = process.env.TRELLO_KEY;
  const token = process.env.TRELLO_TOKEN;
  const listId = process.env.TRELLO_LIST_ID;
  const dailyListId = process.env.TRELLO_DAILY_LIST_ID;
  const todoListId = process.env.TRELLO_TODO_LIST_ID;
  const doingListId = process.env.TRELLO_DOING_LIST_ID;
  const doneListId = process.env.TRELLO_DONE_LIST_ID;
  return { key, token, listId, dailyListId, todoListId, doingListId, doneListId };
};

const buildDesc = ({ videoLink, category, thumbnail, assignmentId }) => {
  const lines = [];
  if (assignmentId) lines.push(`Assignment ID: ${assignmentId}`);
  if (category) lines.push(`Category: ${category}`);
  if (videoLink) lines.push(`Video: ${videoLink}`);
  if (thumbnail) lines.push(`Thumbnail: ${thumbnail}`);
  return lines.join("\n");
};

export const createTrelloCard = async ({ title, videoLink, category, thumbnail, assignmentId }) => {
  const { key, token, listId } = getEnv();
  if (!key || !token || !listId) {
    console.warn("Trello not configured (missing TRELLO_KEY, TRELLO_TOKEN, or TRELLO_LIST_ID). Skipping card creation.");
    return null;
  }
  if (typeof fetch !== "function") {
    throw new Error("Fetch API is not available. Please use Node.js 18+ or add a fetch polyfill.");
  }

  const params = new URLSearchParams({
    key,
    token,
    idList: listId,
    name: title,
    desc: buildDesc({ videoLink, category, thumbnail, assignmentId }),
  });

  const url = `${TRELLO_BASE_URL}/cards?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Trello API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      url: data.url,
      shortUrl: data.shortUrl,
      name: data.name,
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const createDailyUpdateCard = async ({ title, description }) => {
  const { key, token, dailyListId, listId, todoListId } = getEnv();
  const targetListId = dailyListId || todoListId || listId;

  if (!key || !token || !targetListId) {
    console.warn("Trello not configured (missing TRELLO_KEY, TRELLO_TOKEN, or TRELLO_DAILY_LIST_ID/TRELLO_LIST_ID). Skipping daily update card.");
    return null;
  }
  if (typeof fetch !== "function") {
    throw new Error("Fetch API is not available. Please use Node.js 18+ or add a fetch polyfill.");
  }

  const params = new URLSearchParams({
    key,
    token,
    idList: targetListId,
    name: title,
    desc: description,
  });

  const url = `${TRELLO_BASE_URL}/cards?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Trello API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      url: data.url,
      shortUrl: data.shortUrl,
      name: data.name,
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const moveCardToList = async ({ cardId, listId }) => {
  const { key, token } = getEnv();
  if (!key || !token || !cardId || !listId) {
    console.warn("Trello not configured (missing key/token/cardId/listId). Skipping move.");
    return null;
  }
  if (typeof fetch !== "function") {
    throw new Error("Fetch API is not available. Please use Node.js 18+ or add a fetch polyfill.");
  }

  const params = new URLSearchParams({
    key,
    token,
    idList: listId,
  });

  const url = `${TRELLO_BASE_URL}/cards/${cardId}?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "PUT",
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Trello move error: ${response.status} ${text}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

export const addCommentToCard = async ({ cardId, text }) => {
  const { key, token } = getEnv();
  if (!key || !token || !cardId) {
    console.warn("Trello not configured (missing TRELLO_KEY, TRELLO_TOKEN, or cardId). Skipping comment.");
    return null;
  }
  if (typeof fetch !== "function") {
    throw new Error("Fetch API is not available. Please use Node.js 18+ or add a fetch polyfill.");
  }

  const params = new URLSearchParams({
    key,
    token,
    text,
  });

  const url = `${TRELLO_BASE_URL}/cards/${cardId}/actions/comments?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      const textResponse = await response.text();
      throw new Error(`Trello comment error: ${response.status} ${textResponse}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};
