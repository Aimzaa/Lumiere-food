require("dotenv").config();
const http = require("http");
const https = require("https");

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/api/chat") {
    console.log("✅ Request aayi!");
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (e) {
        parsed = {};
      }

      const userMessage = parsed.messages?.[0]?.content || "";
      const systemPrompt = parsed.system || "";

      const groqBody = JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 1000,
      });

      const options = {
        hostname: "api.groq.com",
        path: "/openai/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      };

      const apiReq = https.request(options, (apiRes) => {
        let data = "";
        apiRes.on("data", (chunk) => (data += chunk));
        apiRes.on("end", () => {
          console.log("Groq Response:", data);
          try {
            const groqData = JSON.parse(data);
            const text =
              groqData.choices?.[0]?.message?.content || "Sorry, no response.";
            const responseBody = JSON.stringify({
              content: [{ type: "text", text: text }],
            });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(responseBody);
          } catch (e) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Parse error" }));
          }
        });
      });

      apiReq.on("error", (err) => {
        console.log("Error:", err.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });

      apiReq.write(groqBody);
      apiReq.end();
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(3001, () => {
  console.log("✅ Proxy server chal raha hai: http://localhost:3001");
});
