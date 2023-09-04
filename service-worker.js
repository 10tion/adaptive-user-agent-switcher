const loadConfigurations = () => {
    return chrome.storage.local.get(["configs"]);
}

const saveConfigurations = (configs) => {
    return chrome.storage.local.set({ configs: configs }).then(() => {
        console.log("Configuration saved.");
        // refresh res-ua map maintained in this worker.
        resUAMap = new Map(Object.entries(configs));
    });
}

// var defaultUserAgent = navigator.userAgent;

var resUAMap = new Map();

let rules = [
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
}

const registerUserAgent = () => {
    chrome.system.display.getInfo((displayInfo) => {
        let userAgent = getUserAgent(displayInfo[0].bounds.width, displayInfo[0].bounds.height);
        let newRules;
        if (userAgent !== "Default") {
            newRules = rules;
            newRules[0].action.requestHeaders[0].value = userAgent;
            console.log("New user agent set: ", userAgent);
        }
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1],
            addRules: newRules
        });
    });
}

// 
chrome.system.display.onDisplayChanged.addListener(() => {
    registerUserAgent();
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "save") {
        saveConfigurations(request.configs).then(() => registerUserAgent());
    } else if (request.action === "load") {
        loadConfigurations().then((res) => sendResponse({configs: res.configs}));
    }
    return true;
});

registerUserAgent();


