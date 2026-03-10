// background.js - Service Worker
// 处理扩展图标点击事件

// 监听扩展图标点击
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    // 直接将 capture.js 注入到页面的 MAIN 世界
    // 使用 files 参数比手动创建 <script> 标签更可靠，
    // 不受页面 CSP 限制，且可以保证脚本执行完毕后才继续
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      files: ['capture.js']
    });

    // capture.js 执行完毕后，window.figma.captureForDesign 已可用
    // 直接调用捕获
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: executeCapture
    });

  } catch (error) {
    console.error('Failed to inject script:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'HTML to Figma',
      message: `注入失败: ${error.message}`
    });
  }
});

// 在页面 MAIN 世界执行，调用 capture.js 暴露的 API
function executeCapture() {
  // 防止重复触发
  if (window.__figmaCaptureRunning) {
    console.log('Capture already in progress...');
    return;
  }

  if (!window.figma || !window.figma.captureForDesign) {
    console.error('figma.captureForDesign API not available');
    return;
  }

  window.__figmaCaptureRunning = true;

  window.figma.captureForDesign({
    selector: 'body',
    verbose: false
  }).then(result => {
    window.__figmaCaptureRunning = false;
    if (result && result.success === false) {
      console.log(result.cancelled ? 'Capture cancelled' : `Capture failed: ${result.error}`);
    } else {
      console.log('Capture success');
    }
  }).catch(error => {
    window.__figmaCaptureRunning = false;
    console.error('Capture failed:', error);
  });
}
