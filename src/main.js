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

  window.addEventListener(
    "dbclick",
    async (event) => {
      const data = await fetch(
        "https://www.zhihu.com/api/v4/questions/1953365181380912993/followers",
        {
          method: "POST",
          body: JSON.stringify({
            is_following: true,
          }),
        }
      ).then((res) => res.text());
      console.log(data, "data");
    },
    {
      capture: true,
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

  // 监听来自popup的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("收到来自popup的消息：", request);

    switch (request.action) {
      case "changeBackgroundColor":
        // 改变页面背景颜色
        document.body.style.backgroundColor = request.color;
        console.log("页面背景颜色已更改为：", request.color);
        sendResponse({ success: true, message: "背景颜色已更改" });
        break;

      case "exportData":
        // 导出页面数据
        try {
          const pageData = {
            title: document.title,
            url: window.location.href,
            text: document.body.innerText.slice(0, 1000), // 限制长度
            timestamp: new Date().toISOString(),
          };

          // 创建下载链接
          const dataStr = JSON.stringify(pageData, null, 2);
          const dataBlob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(dataBlob);

          const link = document.createElement("a");
          link.href = url;
          link.download = `page-data-${Date.now()}.json`;
          link.click();

          URL.revokeObjectURL(url);
          sendResponse({ success: true, message: "数据导出成功" });
        } catch (error) {
          console.error("导出数据失败：", error);
          sendResponse({ success: false, message: "导出数据失败" });
        }
        break;

      case "executeScript":
        // 执行自定义脚本
        try {
          // 注意：这里需要谨慎处理，避免安全风险
          if (request.script && typeof request.script === "string") {
            // 简单的脚本执行，只允许安全的操作
            const safeScript = request.script.replace(
              /eval|Function|setTimeout|setInterval/g,
              ""
            );
            eval(safeScript);
            sendResponse({ success: true, message: "脚本执行成功" });
          } else {
            sendResponse({ success: false, message: "无效的脚本" });
          }
        } catch (error) {
          console.error("执行脚本失败：", error);
          sendResponse({ success: false, message: "脚本执行失败" });
        }
        break;

      case "executeCustomFunction":
        // 执行自定义功能
        try {
          if (request.type && request.code) {
            switch (request.type) {
              case "script":
                // 执行脚本
                const safeScript = request.code.replace(
                  /eval|Function|setTimeout|setInterval/g,
                  ""
                );
                eval(safeScript);
                break;
              case "style":
                // 应用样式
                const style = document.createElement("style");
                style.textContent = request.code;
                document.head.appendChild(style);
                break;
              case "data":
                // 数据处理
                console.log("数据处理:", request.code);
                break;
              case "action":
                // 页面操作
                console.log("页面操作:", request.code);
                break;
            }
            sendResponse({ success: true, message: "自定义功能执行成功" });
          } else {
            sendResponse({ success: false, message: "无效的自定义功能" });
          }
        } catch (error) {
          console.error("执行自定义功能失败：", error);
          sendResponse({ success: false, message: "执行自定义功能失败" });
        }
        break;

      default:
        sendResponse({ success: false, message: "未知的操作" });
    }

    return true; // 保持消息通道开放
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

  const logo = document.querySelector(".tiny-remoter-floating-block__icon");
  logo.addEventListener("click", async () => {
    const data = await fetch(
      "https://www.zhihu.com/api/v4/questions/1953365181380912993/followers",
      {
        method: "POST",
        body: JSON.stringify({
          is_following: true,
        }),
      }
    ).then((res) => res.text());
    console.log(data, "data");
  });

  window.addEventListener("pagehide", async () => {
    await transport.terminateSession();
  });
}

connect();
