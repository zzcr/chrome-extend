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
