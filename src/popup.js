// popup.js - OpenTiny NEXT 智能助手弹窗逻辑
// 这个文件处理弹窗的所有交互逻辑和菜单定制功能

class PopupManager {
  constructor() {
    this.menuItems = [];
    this.init();
  }

  // 初始化弹窗
  init() {
    this.loadMenuItems();
    this.bindEvents();
    this.renderMenuItems();
    this.updateStatus();
  }

  // 绑定事件监听器
  bindEvents() {
    // 快速操作按钮
    document.getElementById("changeBgColor").addEventListener("click", () => {
      this.changeBackgroundColor();
    });

    document.getElementById("openSidebar").addEventListener("click", () => {
      this.openSidebar();
    });

    document.getElementById("openOptions").addEventListener("click", () => {
      this.openOptionsPage();
    });

    // 添加菜单按钮
    document.getElementById("addMenuBtn").addEventListener("click", () => {
      this.showAddMenuModal();
    });

    // 模态框相关事件
    document.getElementById("closeModal").addEventListener("click", () => {
      this.hideAddMenuModal();
    });

    document.getElementById("cancelBtn").addEventListener("click", () => {
      this.hideAddMenuModal();
    });

    document.getElementById("saveMenuBtn").addEventListener("click", () => {
      this.saveMenuItem();
    });

    // 动作类型变化事件
    document.getElementById("menuAction").addEventListener("change", (e) => {
      this.toggleActionFields(e.target.value);
    });

    // 底部按钮
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.refreshExtension();
    });

    document.getElementById("helpBtn").addEventListener("click", () => {
      this.showHelp();
    });

    // 点击模态框外部关闭
    document.getElementById("addMenuModal").addEventListener("click", (e) => {
      if (e.target.id === "addMenuModal") {
        this.hideAddMenuModal();
      }
    });
  }

  // 改变页面背景颜色
  async changeBackgroundColor() {
    try {
      // 生成随机颜色
      const colors = [
        "#ff6b6b",
        "#4ecdc4",
        "#45b7d1",
        "#96ceb4",
        "#feca57",
        "#ff9ff3",
        "#54a0ff",
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // 向content script发送消息
      await chrome.tabs.sendMessage(tab.id, {
        action: "changeBackgroundColor",
        color: randomColor,
      });

      // 显示成功提示
      this.showNotification("背景颜色已更改！", "success");
    } catch (error) {
      console.error("更改背景颜色失败:", error);
      this.showNotification("更改背景颜色失败", "error");
    }
  }

  // 打开侧边栏
  async openSidebar() {
    try {
      await chrome.sidePanel.open({
        windowId: chrome.windows.WINDOW_ID_CURRENT,
      });
      this.showNotification("侧边栏已打开！", "success");
    } catch (error) {
      console.error("打开侧边栏失败:", error);
      this.showNotification("打开侧边栏失败", "error");
    }
  }

  // 打开设置页面
  openOptionsPage() {
    chrome.runtime.openOptionsPage();
  }

  // 显示添加菜单模态框
  showAddMenuModal() {
    const modal = document.getElementById("addMenuModal");
    modal.classList.add("show");
    modal.style.display = "flex";

    // 重置表单
    document.getElementById("menuTitle").value = "";
    document.getElementById("menuAction").value = "changeColor";
    document.getElementById("menuUrl").value = "";
    document.getElementById("menuScript").value = "";
    this.toggleActionFields("changeColor");
  }

  // 隐藏添加菜单模态框
  hideAddMenuModal() {
    const modal = document.getElementById("addMenuModal");
    modal.classList.remove("show");
    modal.style.display = "none";
  }

  // 根据动作类型切换显示字段
  toggleActionFields(actionType) {
    const urlGroup = document.getElementById("urlGroup");
    const scriptGroup = document.getElementById("scriptGroup");

    // 隐藏所有额外字段
    urlGroup.style.display = "none";
    scriptGroup.style.display = "none";

    // 根据动作类型显示相应字段
    switch (actionType) {
      case "openUrl":
        urlGroup.style.display = "block";
        break;
      case "customScript":
        scriptGroup.style.display = "block";
        break;
    }
  }

  // 保存菜单项
  saveMenuItem() {
    const title = document.getElementById("menuTitle").value.trim();
    const action = document.getElementById("menuAction").value;
    const url = document.getElementById("menuUrl").value.trim();
    const script = document.getElementById("menuScript").value.trim();

    // 验证输入
    if (!title) {
      this.showNotification("请输入菜单标题", "error");
      return;
    }

    if (action === "openUrl" && !url) {
      this.showNotification("请输入网址", "error");
      return;
    }

    if (action === "customScript" && !script) {
      this.showNotification("请输入脚本代码", "error");
      return;
    }

    // 创建菜单项
    const menuItem = {
      id: Date.now().toString(),
      title: title,
      action: action,
      url: url,
      script: script,
      createdAt: new Date().toISOString(),
    };

    // 添加到菜单列表
    this.menuItems.push(menuItem);
    this.saveMenuItems();
    this.renderMenuItems();
    this.hideAddMenuModal();

    this.showNotification("菜单项已添加！", "success");
  }

  // 渲染菜单项列表
  renderMenuItems() {
    const menuList = document.getElementById("menuList");

    if (this.menuItems.length === 0) {
      menuList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div class="empty-state-text">暂无自定义菜单</div>
                    <div class="empty-state-subtext">点击 + 按钮添加菜单项</div>
                </div>
            `;
      return;
    }

    menuList.innerHTML = this.menuItems
      .map(
        (item) => `
            <div class="menu-item" data-id="${item.id}">
                <div class="menu-item-info">
                    <div class="menu-item-title">${this.escapeHtml(
                      item.title
                    )}</div>
                    <div class="menu-item-action">${this.getActionDescription(
                      item.action
                    )}</div>
                </div>
                <div class="menu-item-actions">
                    <button class="menu-item-btn" onclick="popupManager.executeMenuItem('${
                      item.id
                    }')" title="执行">
                        ▶️
                    </button>
                    <button class="menu-item-btn delete" onclick="popupManager.deleteMenuItem('${
                      item.id
                    }')" title="删除">
                        🗑️
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  // 执行菜单项
  async executeMenuItem(itemId) {
    const item = this.menuItems.find((item) => item.id === itemId);
    if (!item) return;

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      switch (item.action) {
        case "changeColor":
          await chrome.tabs.sendMessage(tab.id, {
            action: "changeBackgroundColor",
            color: this.getRandomColor(),
          });
          this.showNotification("页面颜色已更改！", "success");
          break;

        case "exportData":
          await chrome.tabs.sendMessage(tab.id, {
            action: "exportData",
          });
          this.showNotification("数据导出已开始！", "success");
          break;

        case "openUrl":
          if (item.url) {
            chrome.tabs.create({ url: item.url });
            this.showNotification("已打开新标签页！", "success");
          }
          break;

        case "customScript":
          if (item.script) {
            await chrome.tabs.sendMessage(tab.id, {
              action: "executeScript",
              script: item.script,
            });
            this.showNotification("自定义脚本已执行！", "success");
          }
          break;
      }
    } catch (error) {
      console.error("执行菜单项失败:", error);
      this.showNotification("执行失败，请检查页面是否支持此操作", "error");
    }
  }

  // 删除菜单项
  deleteMenuItem(itemId) {
    if (confirm("确定要删除这个菜单项吗？")) {
      this.menuItems = this.menuItems.filter((item) => item.id !== itemId);
      this.saveMenuItems();
      this.renderMenuItems();
      this.showNotification("菜单项已删除", "success");
    }
  }

  // 获取动作描述
  getActionDescription(action) {
    const descriptions = {
      changeColor: "改变页面颜色",
      exportData: "导出数据",
      openUrl: "打开网址",
      customScript: "执行脚本",
    };
    return descriptions[action] || "未知动作";
  }

  // 获取随机颜色
  getRandomColor() {
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
      "#00d2d3",
      "#ff9f43",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // 刷新扩展
  refreshExtension() {
    chrome.runtime.reload();
  }

  // 显示帮助信息
  showHelp() {
    alert(`OpenTiny NEXT 智能助手使用说明：

1. 快速操作：
   - 改变背景色：随机更改当前页面的背景颜色
   - 设置：打开扩展设置页面

2. 自定义菜单：
   - 点击 + 按钮添加自定义菜单项
   - 支持改变页面颜色、导出数据、打开网址、执行自定义脚本
   - 可以编辑和删除已添加的菜单项

3. 版本信息：当前版本 1.0.0

如有问题，请联系开发团队。`);
  }

  // 更新连接状态
  updateStatus() {
    // 这里可以添加检查扩展状态的逻辑
    // 目前简单显示为已连接状态
    const statusText = document.querySelector(".status-text");
    const statusDot = document.querySelector(".status-dot");

    statusText.textContent = "已连接";
    statusDot.style.background = "#4ade80";
  }

  // 显示通知
  showNotification(message, type = "info") {
    // 创建通知元素
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // 添加样式
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;

    // 根据类型设置背景色
    const colors = {
      success: "#10b981",
      error: "#ef4444",
      info: "#3b82f6",
      warning: "#f59e0b",
    };
    notification.style.background = colors[type] || colors.info;

    // 添加到页面
    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // HTML转义
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // 保存菜单项到存储
  saveMenuItems() {
    chrome.storage.local.set({ menuItems: this.menuItems });
  }

  // 从存储加载菜单项
  async loadMenuItems() {
    try {
      const result = await chrome.storage.local.get(["menuItems"]);
      this.menuItems = result.menuItems || [];
    } catch (error) {
      console.error("加载菜单项失败:", error);
      this.menuItems = [];
    }
  }
}

// 添加CSS动画
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 初始化弹窗管理器
const popupManager = new PopupManager();

// 页面加载完成后的额外初始化
document.addEventListener("DOMContentLoaded", () => {
  console.log("OpenTiny NEXT 弹窗已加载");
});
