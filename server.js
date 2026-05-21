const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const PUBLIC_DIR = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function handleChat(request, response) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    });
    response.end();
    return;
  }

  if (request.method === "GET") {
    sendJson(response, 200, {
      ok: true,
      route: "/api/chat",
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || "gpt-5-mini"
    });
    return;
  }

  if (request.method !== "POST") {
    response.writeHead(405, { Allow: "POST" });
    response.end("Method not allowed");
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    sendJson(response, 500, { error: "Missing OPENAI_API_KEY in this Codespaces terminal" });
    return;
  }

  try {
    const body = await readRequestBody(request);
    const { systemPrompt, messages = [] } = JSON.parse(body || "{}");

    if (!systemPrompt || !Array.isArray(messages)) {
      sendJson(response, 400, { error: "Invalid chat payload" });
      return;
    }

    const openAiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        instructions: systemPrompt,
        input: messages.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: String(message.content || "").slice(0, 1200)
        })),
        max_output_tokens: 350
      })
    });

    const data = await openAiResponse.json();

    if (!openAiResponse.ok) {
      sendJson(response, openAiResponse.status, {
        error: data.error?.message || "OpenAI request failed"
      });
      return;
    }

    const answer =
      data.output_text ||
      data.output?.flatMap((item) => item.content || [])
        .find((content) => content.type === "output_text")?.text ||
      "";

    sendJson(response, 200, { answer });
  } catch (error) {
    sendJson(response, 500, {
      error: "Unable to generate chat response",
      detail: error.message
    });
  }
}

function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const decodedPath = decodeURIComponent(requestUrl.pathname);
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = path.resolve(PUBLIC_DIR, relativePath);

  if (!filePath.startsWith(PUBLIC_DIR) || filePath.includes(`${path.sep}.git${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  if (request.url.startsWith("/api/chat")) {
    handleChat(request, response);
    return;
  }

  serveStatic(request, response);
});

server.listen(PORT, () => {
  console.log(`Portfolio running at http://localhost:${PORT}`);
});
