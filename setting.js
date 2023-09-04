const contentLoadConfigurations = () => {
    chrome.runtime.sendMessage({ action: "load" }, response => {
        if (!!response.configs) {
            renderPage(response.configs);
        }
    });
}

const contentSaveConfigurations = () => {
    chrome.runtime.sendMessage({ action: "save", configs: getPageData()}, response => {
        console.log("New configurations saved.")
    });
}

const deleteCurrentRow = (event) => {
    var td = event.target.parentNode;
    var tr = td.parentNode;
    tr.parentNode.removeChild(tr);
}

const addNewRow = (res, ua) => {
    let table = document.getElementById("configurations");
    let row = table.insertRow(-1);
    let deleteButton = document.createElement('input');
    deleteButton.type = "button";
    deleteButton.value = "Delete";
    deleteButton.onclick = deleteCurrentRow;

    row.insertCell(0).innerText = res;
    row.insertCell(1).innerText = ua;
    row.insertCell(2).appendChild(deleteButton);
}

const renderPage = (configs) => {
    for (const [res, ua] of Object.entries(configs)) {
        addNewRow(res, ua);
    }
}

const getPageData = () => {
    let table = document.getElementById("configurations");
    let configs = {}
    for (let i = 1, row; row = table.rows[i]; i++) {
        configs[row.cells[0].innerText] = row.cells[1].innerText;
    }
    return configs;
}

const addConfiguration = () => {
    let newRes = document.getElementById("newResolution").value;
    let newUA = document.getElementById("newUserAgent").value;
    addNewRow(newRes, newUA);

    document.getElementById("newResolution").value = "";
    document.getElementById("newUserAgent").value = "";
}

const detectDisplay = () => {
    chrome.system.display.getInfo((displayInfo) => {
        document.getElementById("newResolution").value = displayInfo[0].bounds.width + "x" + displayInfo[0].bounds.height;
    });
}

contentLoadConfigurations();

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("addNewConfigButton").addEventListener("click", addConfiguration);
    document.getElementById("detectDisplay").addEventListener("click", detectDisplay);
    document.getElementById("save").addEventListener("click", contentSaveConfigurations);
});