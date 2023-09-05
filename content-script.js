const { screen: { height, width } } = window;
chrome.runtime.sendMessage({ action: "updateDisplayInfo", displayInfo: { height: height, width: width }});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { screen: { height, width } } = window;
    if (request.action === 'getDisplayInfo') {
        sendResponse({ displayInfo: {height: height, width: width }});
    }
    return true;
});