// sidepanel.js - OpenTiny NEXT 侧边栏逻辑
// 这个文件处理侧边栏的所有交互逻辑和功能

class SidebarManager {
  constructor() {
    this.customFunctions = [];
    this.history = [];
    this.init();
  }

  // 初始化侧边栏
  async init() {
    await this.loadCustomFunctions();
    await this.loadHistory();
    this.bindEvents();
    this.updatePageInfo();
    this.renderCustomFunctions();
    this.renderHistory();
  }

  // 绑定事件监听器
  bindEvents() {
    // 头部按钮
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.refreshPage();
    });

    document.getElementById("settingsBtn").addEventListener("click", () => {
      this.openSettings();
    });

    // 快速工具
    document.getElementById("changeBgTool").addEventListener("click", () => {
      this.changeBackgroundColor();
    });

    document.getElementById("exportTool").addEventListener("click", () => {
      this.exportPageData();
    });

    // 自定义功能
    document.getElementById("addCustomBtn").addEventListener("click", () => {
      this.showAddCustomModal();
    });

    // 模态框相关事件
    document
      .getElementById("closeCustomModal")
      .addEventListener("click", () => {
        this.hideAddCustomModal();
      });

    document.getElementById("cancelCustomBtn").addEventListener("click", () => {
      this.hideAddCustomModal();
    });

    document.getElementById("saveCustomBtn").addEventListener("click", () => {
      this.saveCustomFunction();
    });

    // 底部按钮
    document.getElementById("helpBtn").addEventListener("click", () => {
      this.showHelp();
    });

    document.getElementById("feedbackBtn").addEventListener("click", () => {
      this.showFeedback();
    });

    // 点击模态框外部关闭
    document.getElementById("addCustomModal").addEventListener("click", (e) => {
      if (e.target.id === "addCustomModal") {
        this.hideAddCustomModal();
      }
    });
  }

  // 更新页面信息
  async updatePageInfo() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab) {
        document.getElementById("pageTitle").textContent =
          tab.title || "无标题";
        document.getElementById("pageUrl").textContent = tab.url || "未知网址";
        document.getElementById("pageStatus").textContent =
          tab.status || "未知状态";
      }
    } catch (error) {
      console.error("获取页面信息失败:", error);
      document.getElementById("pageTitle").textContent = "获取失败";
      document.getElementById("pageUrl").textContent = "获取失败";
      document.getElementById("pageStatus").textContent = "获取失败";
    }
  }

  // 改变页面背景颜色
  async changeBackgroundColor() {
    try {
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
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      await chrome.tabs.sendMessage(tab.id, {
        action: "changeBackgroundColor",
        color: randomColor,
      });

      this.addToHistory("🎨", "改变页面背景颜色", randomColor);
      this.showNotification("背景颜色已更改！", "success");
    } catch (error) {
      console.error("更改背景颜色失败:", error);
      this.showNotification("更改背景颜色失败", "error");
    }
  }

  // 导出页面数据
  async exportPageData() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      await chrome.tabs.sendMessage(tab.id, {
        action: "exportData",
      });

      this.addToHistory("📊", "导出页面数据", "数据已导出");
      this.showNotification("数据导出已开始！", "success");
    } catch (error) {
      console.error("导出数据失败:", error);
      this.showNotification("导出数据失败", "error");
    }
  }

  // 刷新页面
  async refreshPage() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      await chrome.tabs.reload(tab.id);
      this.addToHistory("🔄", "刷新页面", "页面已刷新");
      this.showNotification("页面已刷新！", "success");
    } catch (error) {
      console.error("刷新页面失败:", error);
      this.showNotification("刷新页面失败", "error");
    }
  }

  // 打开设置
  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  // 显示添加自定义功能模态框
  showAddCustomModal() {
    const modal = document.getElementById("addCustomModal");
    modal.classList.add("show");
    modal.style.display = "flex";

    // 重置表单
    document.getElementById("customTitle").value = "";
    document.getElementById("customType").value = "script";
    document.getElementById("customCode").value = "";
  }

  // 隐藏添加自定义功能模态框
  hideAddCustomModal() {
    const modal = document.getElementById("addCustomModal");
    modal.classList.remove("show");
    modal.style.display = "none";
  }

  // 保存自定义功能
  saveCustomFunction() {
    const title = document.getElementById("customTitle").value.trim();
    const type = document.getElementById("customType").value;
    const code = document.getElementById("customCode").value.trim();

    // 验证输入
    if (!title) {
      this.showNotification("请输入功能名称", "error");
      return;
    }

    if (!code) {
      this.showNotification("请输入功能代码", "error");
      return;
    }

    // 创建自定义功能
    const customFunction = {
      id: Date.now().toString(),
      title: title,
      type: type,
      code: code,
      createdAt: new Date().toISOString(),
    };

    // 添加到列表
    this.customFunctions.push(customFunction);
    this.saveCustomFunctions();
    this.renderCustomFunctions();
    this.hideAddCustomModal();

    this.addToHistory("➕", "添加自定义功能", title);
    this.showNotification("自定义功能已添加！", "success");
  }

  // 渲染自定义功能列表
  renderCustomFunctions() {
    const customList = document.getElementById("customList");

    if (this.customFunctions.length === 0) {
      customList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚙️</div>
          <div class="empty-state-text">暂无自定义功能</div>
          <div class="empty-state-subtext">点击下方按钮添加</div>
        </div>
      `;
      return;
    }

    customList.innerHTML = this.customFunctions
      .map(
        (func) => `
          <div class="custom-item" data-id="${func.id}">
            <div class="custom-item-info">
              <div class="custom-item-title">${this.escapeHtml(
                func.title
              )}</div>
              <div class="custom-item-type">${this.getTypeDescription(
                func.type
              )}</div>
            </div>
            <div class="custom-item-actions">
              <button class="custom-item-btn" onclick="sidebarManager.executeCustomFunction('${
                func.id
              }')" title="执行">
                ▶️
              </button>
              <button class="custom-item-btn delete" onclick="sidebarManager.deleteCustomFunction('${
                func.id
              }')" title="删除">
                🗑️
              </button>
            </div>
          </div>
        `
      )
      .join("");
  }

  // 执行自定义功能
  async executeCustomFunction(funcId) {
    const func = this.customFunctions.find((f) => f.id === funcId);
    if (!func) return;

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      await chrome.tabs.sendMessage(tab.id, {
        action: "executeCustomFunction",
        type: func.type,
        code: func.code,
      });

      this.addToHistory("⚙️", "执行自定义功能", func.title);
      this.showNotification("自定义功能已执行！", "success");
    } catch (error) {
      console.error("执行自定义功能失败:", error);
      this.showNotification("执行自定义功能失败", "error");
    }
  }

  // 删除自定义功能
  deleteCustomFunction(funcId) {
    if (confirm("确定要删除这个自定义功能吗？")) {
      this.customFunctions = this.customFunctions.filter(
        (f) => f.id !== funcId
      );
      this.saveCustomFunctions();
      this.renderCustomFunctions();
      this.addToHistory("🗑️", "删除自定义功能", "功能已删除");
      this.showNotification("自定义功能已删除", "success");
    }
  }

  // 获取类型描述
  getTypeDescription(type) {
    const descriptions = {
      script: "执行脚本",
      style: "修改样式",
      data: "数据处理",
      action: "页面操作",
    };
    return descriptions[type] || "未知类型";
  }

  // 渲染历史记录
  renderHistory() {
    const historyList = document.getElementById("historyList");

    if (this.history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-text">暂无操作历史</div>
        </div>
      `;
      return;
    }

    // 只显示最近10条记录
    const recentHistory = this.history.slice(-10).reverse();

    historyList.innerHTML = recentHistory
      .map(
        (item) => `
          <div class="history-item">
            <span class="history-icon">${item.icon}</span>
            <span class="history-text">${this.escapeHtml(item.text)}</span>
            <span class="history-time">${this.formatTime(item.time)}</span>
          </div>
        `
      )
      .join("");
  }

  // 添加到历史记录
  addToHistory(icon, text, detail = "") {
    const historyItem = {
      icon: icon,
      text: text,
      detail: detail,
      time: new Date().toISOString(),
    };

    this.history.push(historyItem);
    this.saveHistory();
    this.renderHistory();
  }

  // 格式化时间
  formatTime(timeString) {
    const time = new Date(timeString);
    const now = new Date();
    const diff = now - time;

    if (diff < 60000) {
      return "刚刚";
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return time.toLocaleDateString();
    }
  }

  // 显示帮助信息
  showHelp() {
    alert(`OpenTiny NEXT 侧边栏使用说明：

1. 快速工具：
   - 改变背景：随机更改页面背景颜色
   - 导出数据：导出当前页面数据为JSON文件

2. 自定义功能：
   - 可以添加自定义的脚本、样式、数据处理等功能
   - 支持执行、删除自定义功能
   - 功能会在当前页面中执行

3. 操作历史：
   - 记录最近的操作历史
   - 方便查看和回顾操作记录

4. 页面信息：
   - 显示当前页面的标题、网址、状态等信息

如有问题，请联系开发团队。`);
  }

  // 显示反馈
  showFeedback() {
    const feedback = prompt("请输入您的反馈意见：");
    if (feedback && feedback.trim()) {
      this.addToHistory("💬", "提交反馈", feedback.trim());
      this.showNotification("反馈已提交，感谢您的建议！", "success");
    }
  }

  // 显示通知
  showNotification(message, type = "info") {
    // 创建通知元素
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

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

  // 保存自定义功能到存储
  saveCustomFunctions() {
    chrome.storage.local.set({ customFunctions: this.customFunctions });
  }

  // 从存储加载自定义功能
  async loadCustomFunctions() {
    try {
      const result = await chrome.storage.local.get(["customFunctions"]);
      this.customFunctions = result.customFunctions || [];
    } catch (error) {
      console.error("加载自定义功能失败:", error);
      this.customFunctions = [];
    }
  }

  // 保存历史记录到存储
  saveHistory() {
    chrome.storage.local.set({ sidebarHistory: this.history });
  }

  // 从存储加载历史记录
  async loadHistory() {
    try {
      const result = await chrome.storage.local.get(["sidebarHistory"]);
      this.history = result.sidebarHistory || [];
    } catch (error) {
      console.error("加载历史记录失败:", error);
      this.history = [];
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

// 初始化侧边栏管理器
const sidebarManager = new SidebarManager();

// 页面加载完成后的额外初始化
document.addEventListener("DOMContentLoaded", () => {
  console.log("OpenTiny NEXT 侧边栏已加载");
});
