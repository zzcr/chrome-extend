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

const init = async () => {
  const script = await fetch("https://ai.opentiny.design/tools/index.js").then(
    (res) => res.text()
  );

  debugger;
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
        world: "MAIN",
      },
    ]);
  } else {
    // Register new script.
    await chrome.userScripts.register([
      {
        id: USER_SCRIPT_ID,
        matches: ["https://*/*", "http://*/*"],
        js: [{ code: script }],
        world: "MAIN",
      },
    ]);
  }
};

init();
