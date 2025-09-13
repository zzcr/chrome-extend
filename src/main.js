const {
  createMessageChannelPairTransport,
  WebMcpServer,
  WebMcpClient,
  ResourceTemplate,
  createRemoter,
  z,
} = WebMCP;

async function connect() {
  // Create pair MCP transports
  const [serverTransport, clientTransport] =
    createMessageChannelPairTransport();
  // Create an MCP server
  const server = new WebMcpServer({
    name: "demo-server",
    version: "1.0.0",
  });

  // Add an addition tool
  server.registerTool(
    "generate-color",
    {
      title: "生成页面背景颜色",
      description:
        "根据用户的心情或者情绪生成页面的背景颜色,要求：传入的color参数格式为十六进制颜色值,比如 #000000",
      inputSchema: { color: z.string() },
    },
    async ({ color }) => {
      document.body.style.backgroundColor = color;
      return {
        content: [{ type: "text", text: String(color) }],
      };
    }
  );

  // Create an MCP Client
  const client = new WebMcpClient({
    name: "demo-client",
    version: "1.0.0",
  });

  // Connect the client and server
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  // Connect to the Web Agent server
  const { transport, sessionId } = await client.connect({
    url: "https://agent.opentiny.design/api/v1/webmcp-trial/mcp",
    agent: true,
  });

  console.log(sessionId), 1111;

  //   document.getElementById("sessionId").innerHTML = sessionId;

  createRemoter({
    sessionId,
    qrCodeUrl:
      "https://ai.opentiny.design/next-remoter?title=遥控器&welcome-title=背景变变变&welcome-desc=请说一句能表达情绪的话，页面会自动更新一个适合的颜色&suggestion=很高兴&suggestion=有点兴奋&suggestion=风和日丽",
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
