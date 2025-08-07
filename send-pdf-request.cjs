const { spawn } = require("child_process");

const server = spawn("node", ["dist/server.js"], {
  stdio: ["pipe", "pipe", "inherit"]
});

const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "convert_efax_document",
    arguments: {
      filePath: "tests/test-files/Filled_Sample 1.pdf",
      performOCR: true,
      ocrLanguage: "eng",
      extractMetadata: true
    }
  }
};

server.stdout.on("data", (data) => {
  console.log("[PDF Output]:", data.toString());
});

server.stdin.write(JSON.stringify(request) + "\n");
server.stdin.end();
