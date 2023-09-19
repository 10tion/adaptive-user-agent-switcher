const loadConfigurations = () => {
    return chrome.storage.local.get(["configs"]);
}

const saveConfigurations = (configs) => {
    return chrome.storage.local.set({ configs: configs }).then(() => {
        console.log("Configuration saved.");
        resUAMap = new Map(Object.entries(configs));
    });
}

let resUAMap = new Map();

let currentDisplay = { height: 0, width: 0 }

let rules_template = [
    {
        id: 1,
        priority: 1,
        action: {
            type: "modifyHeaders",
            requestHeaders: [
                {
                    header: "user-agent",
                    operation: "set",
                    value: "",
                },
            ]
        },
        condition: {
            resourceTypes: ["main_frame"],
            urlFilter: "*"
        }
    }
];

loadConfigurations().then((result) => {
    if (!!result.configs) {
        resUAMap = new Map(Object.entries(result.configs));
    }
});

const getUserAgent = (width, height) => {
    let res = width + "x" + height;
    if (resUAMap.has(res)) {
        return resUAMap.get(res);
    } else {
        return "Default";
    }
};

const registerUserAgent = () => {
    let userAgent = getUserAgent(currentDisplay.width, currentDisplay.height);
    let newRules;
    if (userAgent !== "Default") {
        newRules = rules_template;
        newRules[0].action.requestHeaders[0].value = userAgent;
        console.log("New user agent set: ", userAgent);
    }
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
        addRules: newRules
    });
}

// Reset UA on any display changes.
chrome.system.display.onDisplayChanged.addListener(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
        if (chrome.runtime.lastError)
            console.error(chrome.runtime.lastError);
        chrome.tabs.sendMessage(tab.id, { action: "getDisplayInfo" }, response => {
            if (!!response && !!response.displayInfo) {
                currentDisplay = response.displayInfo;
                registerUserAgent();
            }
        });
    });
})

// Communicate with content script and settings.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "save") {
        saveConfigurations(request.configs).then(() => registerUserAgent());
    } else if (request.action === "load") {
        loadConfigurations().then((res) => sendResponse({configs: res.configs}));
    } else if (request.action === "updateDisplayInfo") {
        if (request.displayInfo.height != currentDisplay.height || request.displayInfo.width != currentDisplay.width) {
            currentDisplay = request.displayInfo;
            registerUserAgent();
        }
    }
    return true;
});

registerUserAgent();