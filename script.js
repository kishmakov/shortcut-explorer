let app = {
    elements: {
        view: document.getElementById("viewId"),
        input: document.getElementById("inputId"),
        suggest: document.getElementById("suggestId")
    },
    input: {
        key: null,
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
        } else {
            throw new Error('Failed to fetch "codes.json"');
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
    app.input.key = event.key;
    updateSuggestions();
});

// Logic

function clearInput() {
    app.elements.input.value = "";
    app.elements.suggest.innerHTML = "";
}

function updateSuggestions() {
    const filteredCodes = app.codes.filter(code => {
        if (app.chosenKeys.has(code["id"])) return false
        if (code["id"] === app.input.key) return true
        if (app.input.text.length == 0) return false
        return code["aliases"].filter(alias => alias.includes(app.input.text)).length > 0
    });
    displaySuggestions(filteredCodes);
}

function displaySuggestions(codes) {
    app.elements.suggest.innerHTML = "";
    codes.forEach(code => createSuggest(code));
}

function updateShortcut() {
    app.elements.view.innerHTML = "";
    app.codes.forEach(code => {
        if (app.chosenKeys.has(code["id"])) {
            const shortcutKey = document.createElement("div");
            shortcutKey.className = "row"
            shortcutKey.appendChild(createKeyDiv(code));
            appentHintTo(shortcutKey, "-", "red");

            shortcutKey.addEventListener("click", function () {
                app.chosenKeys.delete(code["id"]);
                updateShortcut();
            });

            app.elements.view.appendChild(shortcutKey);
        }
    });
}

function createSuggest(code) {
    const suggestion = document.createElement("div");

    appendMatchedText(suggestion, code);
    suggestion.appendChild(createKeyDiv(code));
    appentHintTo(suggestion, "+", "green");

    suggestion.className = "suggested"
    app.elements.suggest.appendChild(suggestion);

    suggestion.addEventListener("click", function () {
        clearInput();
        app.chosenKeys.add(code["id"]);
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
    result.className = "suggestedText";

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

function appentHintTo(element, text, style) {
    const plusSpan = document.createElement("span");
    plusSpan.classList.add("suggestedText");
    plusSpan.classList.add(style);
    plusSpan.classList.add("hidden");
    plusSpan.textContent = text;

    element.addEventListener("mouseover", function () {
        plusSpan.classList.remove("hidden");
    });

    element.addEventListener("mouseout", function () {
        plusSpan.classList.add("hidden");
    });

    element.appendChild(plusSpan);
}