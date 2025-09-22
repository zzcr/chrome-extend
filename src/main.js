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

  server.registerTool(
    "add-tar",
    {
      title: "新增出差申请",
      description: "新增出差申请,要求：传入的name参数格式为字符串,比如 张三",
      inputSchema: { name: z.string() },
    },
    async ({ name }) => {
      const res = await fetch("https://www.baidu.com/", {
        method: "GET",
      }).then((res) => res.text());

      return {
        content: [
          { type: "text", text: `${name}的出差计划是：${res.slice(0, 5)}` },
        ],
      };
    }
  );

  window.addEventListener(
    "message",
    function (event) {
      // 非常重要！验证消息来源，避免处理来自其他脚本的恶意消息
      // if (event.source != window) return;

      // 只处理我们定义好的消息类型
      if (event.data.type && event.data.type == "FROM_PAGE") {
        console.log("从网页收到：", event.data.payload);
      }
    },
    false
  );

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
  const { transport, sessionId: sessionId2 } = await client.connect({
    url: "https://agent.opentiny.design/api/v1/webmcp-trial/mcp",
    sessionId,
    agent: true,
  });

  localStorage.setItem("sessionId", sessionId2);

  console.log(sessionId2);

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
