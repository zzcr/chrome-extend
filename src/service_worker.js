chrome.contextMenus.create({
  type: "normal",
  title: "批量导出",
  id: "menu-1",
});

chrome.action.setBadgeBackgroundColor({ color: "#f00" });
chrome.action.setBadgeText({
  text: "1",
});

// 设置侧边栏行为
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => {
      console.error("设置侧边栏行为失败:", error);
    });
});

const USER_SCRIPT_ID = "default";
const script = `
 setTimeout(() => {
  console.log(window.WebMCP,111)
 }, 2000);
`;

const init = async () => {
  const existingScripts = await chrome.userScripts.getScripts({
    ids: [USER_SCRIPT_ID],
  });

  if (existingScripts.length > 0) {
    // Update existing script.
    await chrome.userScripts.update([
      {
        id: USER_SCRIPT_ID,
        matches: ["https://*/*", "http://*/*"],
        js: [{ code: script }],
      },
    ]);
  } else {
    // Register new script.
    await chrome.userScripts.register([
      {
        id: USER_SCRIPT_ID,
        matches: ["https://*/*", "http://*/*"],
        js: [{ code: script }],
      },
    ]);
  }
};

init();
