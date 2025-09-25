const {
  createMessageChannelPairTransport,
  WebMcpServer,
  WebMcpClient,
  ResourceTemplate,
  createRemoter,
  z,
} = WebMCP;

async function connect() {
  const cookie = document.cookie;
  const { __snaker__id } = cookie.split("; ").reduce((acc, cookie) => {
    const [key, value] = cookie.split("=");
    acc[key] = value;
    return acc;
  }, {});

  // Create pair MCP transports
  const [serverTransport, clientTransport] =
    createMessageChannelPairTransport();
  // Create an MCP server
  const server = new WebMcpServer({
    name: "demo-server",
    version: "1.0.0",
  });

  // Create an MCP Client
  const client = new WebMcpClient({
    name: "demo-client",
    version: "1.0.0",
  });

  // Connect the client and server
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const sessionId = localStorage.getItem("sessionId");

  // Connect to the Web Agent server
  const { transport, sessionId: id } = await client.connect({
    url: "https://agent.opentiny.design/api/v1/webmcp-trial/mcp",
    sessionId,
    agent: true,
  });

  localStorage.setItem("sessionId", id);

  console.log(id);

  createRemoter({
    sessionId: id,
    qrCodeUrl: "https://ai.opentiny.design/next-remoter",
    menuItems: [
      {
        action: "ai-chat",
        show: false,
      },
    ],
  });

  window.addEventListener("pagehide", async () => {
    await transport.terminateSession();
  });
}

connect();
