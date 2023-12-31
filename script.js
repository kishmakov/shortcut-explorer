let app = {
    elements: {
        view: document.getElementById("viewId"),
        input: document.getElementById("inputId"),
        suggest: document.getElementById("suggestId"),

        separator: document.getElementById("separatorId"),

        os: document.getElementById("osId"),
        ide: document.getElementById("ideId"),
        browser: document.getElementById("browserId")
    },
    input: {
        key: null,
        code: null,
        text: ""
    },
    chosenKeys: new Set(),
    codes: {},
    shortcuts: {}
};

// Loading data

fetch('codes.json')
    .then(async response => {
        if (response.ok) {
            const data = await response.json();
            app.codes = data["codes"];
            app.codes.forEach(code => {
                code["key"] = code["key"].toLowerCase();
            });

        } else {
            throw new Error('Failed to fetch "codes.json"');
        }
    })
    .catch(error => {
        console.error(error);
    });


fetch('shortcuts.json')
    .then(async response => {
        if (response.ok) {
            app.shortcuts = await response.json();
        } else {
            throw new Error('Failed to fetch "shortcuts.json"');
        }
    })
    .catch(error => {
        console.error(error);
    });

// Listeners

app.elements.input.addEventListener("input", function () {
    app.input.text = app.elements.input.value.toLowerCase();
    updateSuggestions();
});

document.addEventListener("click", function (event) {
    if (event.target !== app.elements.input && event.target !== app.elements.suggest) {
        clearInput();
    }
});

document.addEventListener("keydown", function (event) {
    app.input.key = event.key.toLowerCase();
    app.input.code = event.code;
    updateSuggestions();
});

// Logic

function clearInput() {
    app.elements.input.value = "";
    app.elements.suggest.innerHTML = "";
}

function updateSuggestions() {
    const codeMatch = app.codes.filter(code => {
        if (app.chosenKeys.has(code["key"])) return false
        return code["key"] === app.input.key;
    });

    const aliasMatch = app.codes.filter(code => {
        if (app.chosenKeys.has(code["key"])) return false
        if (code["key"] === app.input.key) return false
        if (app.input.text.length == 0) return false
        return code["aliases"].filter(alias => alias.includes(app.input.text)).length > 0
    });

    displaySuggestions(codeMatch.concat(aliasMatch));
}

function displaySuggestions(codes) {
    app.elements.suggest.innerHTML = "";
    codes.forEach(code => createSuggest(code));
}

function updateShortcut() {
    app.elements.view.innerHTML = "";
    app.codes.forEach(code => {
        if (app.chosenKeys.has(code["key"])) {
            const shortcutKey = document.createElement("div");
            shortcutKey.appendChild(createKeyDiv(code));
            appentHintTo(shortcutKey, "-", "red", "red-bg");
            shortcutKey.className = "row"
            shortcutKey.addEventListener("click", function () {
                app.chosenKeys.delete(code["key"]);
                updateShortcut();
            });

            app.elements.view.appendChild(shortcutKey);
        }
    });

    displayFoundShortcuts(app.elements.browser, "Browser", "browser");
    displayFoundShortcuts(app.elements.ide, "IDE", "IDE");
    displayFoundShortcuts(app.elements.os, "OS", "operating system");
}

function createSuggest(code) {
    const suggestion = document.createElement("div");

    appendMatchedText(suggestion, code);
    suggestion.appendChild(createKeyDiv(code));
    appentHintTo(suggestion, "+", "green", "green-bg");

    suggestion.className = "suggested"
    app.elements.suggest.appendChild(suggestion);

    suggestion.addEventListener("click", function () {
        clearInput();
        app.chosenKeys.add(code["key"]);
        updateShortcut();
    });
}

function createKeyDiv(code) {
    const keyDiv = document.createElement("div");
    keyDiv.className = "keystroke";
    keyDiv.textContent = code["view"];
    return keyDiv;
}

function appendMatchedText(element, code) {
    const matchedAliases = code["aliases"].filter(alias => alias.includes(app.input.text));
    if (matchedAliases.length == 0) return;

    const alias = matchedAliases[0];
    const index = alias.indexOf(app.input.text);

    const prefix = alias.substring(0, index)
    const suffix = alias.substring(index + app.input.text.length)

    const result = document.createElement("p");
    result.className = "suggested-text";

    if (prefix.length > 0) {
        const prefixSpan = document.createElement("span");
        prefixSpan.textContent = prefix;
        result.appendChild(prefixSpan);
    }

    const textSpan = document.createElement("span");
    textSpan.textContent = app.input.text;
    textSpan.className = "blue";
    result.appendChild(textSpan);

    if (suffix.length > 0) {
        const suffixSpan = document.createElement("span");
        suffixSpan.textContent = suffix;
        result.appendChild(suffixSpan);
    }

    element.appendChild(result);
}

function appentHintTo(element, text, style, backgroundStyl) {
    const plusSpan = document.createElement("span");
    plusSpan.classList.add("suggested-text");
    plusSpan.classList.add(style);
    plusSpan.classList.add("hidden");
    plusSpan.textContent = text;

    element.addEventListener("mouseover", function () {
        plusSpan.classList.remove("hidden");
        element.classList.add(backgroundStyl);
    });

    element.addEventListener("mouseout", function () {
        plusSpan.classList.add("hidden");
        element.classList.remove(backgroundStyl);
    });

    element.appendChild(plusSpan);
}

function sameSets(set, array) {
    if (set.size != array.length) return false
    return array.filter(code => set.has(code.toLowerCase())).length == set.size;
}

function displayFoundShortcuts(element, categoryId, category) {
    shortcuts = app.shortcuts[categoryId]
    stubText = "No " + category + " claiming this shortcut found."
    element.innerHTML = ""
    app.elements.separator.classList.add("hidden")

    if (app.chosenKeys.size == 0) return

    app.elements.separator.classList.remove("hidden")
    let found = false

    shortcuts.forEach(shortcut => {
        if (sameSets(app.chosenKeys, shortcut["keys"])) {
            element.appendChild(createOccurrence(shortcut));
            found = true
        }
    });

    if (!found) {
        const item = document.createElement("div");
        item.textContent = stubText;
        item.className = "grey"
        element.appendChild(item);
    }
}

function createOccurrence(shortcut) {
    const div = document.createElement("div");
    const occurrence = document.createElement("p");

    const name = document.createElement("span");
    name.textContent = shortcut["name"];
    occurrence.appendChild(name);

    if (shortcut["platforms"] != null) {
        shortcut["platforms"].forEach(platform => {
            const plname = document.createElement("span");
            plname.textContent = " @" + platform
            plname.classList.add("grey");
            plname.classList.add("note");
            occurrence.appendChild(plname);
        });
    }

    if (shortcut["from"] != null || shortcut["to"] != null) {
        const from = shortcut["from"] ? shortcut["from"] : " ";
        const to = shortcut["to"] ? shortcut["to"] : " ";
        const range = document.createElement("span");
        range.textContent = " (" + from + " \u2014 " + to + ")";
        occurrence.appendChild(range);
    }

    div.appendChild(occurrence);

    if (shortcut["info"] != null) {
        const info = document.createElement("p");
        info.classList.add("grey");
        info.classList.add("note");
        info.textContent = shortcut["info"];
        div.appendChild(info);
    }

    return div;
}
