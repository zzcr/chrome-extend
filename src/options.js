window.onload = function () {
  console.log("options.js");
};
const USER_SCRIPT_ID = "default";
const script = `alert(111)`;

const init = async () => {
  const existingScripts = await chrome.userScripts.getScripts({
    ids: [USER_SCRIPT_ID],
  });

  if (existingScripts.length > 0) {
    // Update existing script.
    await chrome.userScripts.update([
      {
        id: USER_SCRIPT_ID,
        matches: ["https://*/*", "http://*/*", "127.0.0.1:*/*"],
        js: [{ code: script }],
      },
    ]);
  } else {
    // Register new script.
    await chrome.userScripts.register([
      {
        id: USER_SCRIPT_ID,
        matches: ["https://*/*", "http://*/*", "127.0.0.1:*/*"],
        js: [{ code: script }],
      },
    ]);
  }
};

init();
