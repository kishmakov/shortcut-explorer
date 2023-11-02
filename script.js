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
        app.elements.suggest.innerHTML = "";
    }
});

document.addEventListener("keydown", function (event) {
    app.input.key = event.key;
    updateSuggestions();
});

// Logic

function updateSuggestions() {
    const filteredCodes = app.codes.filter(code => {
        if (code["id"] === app.input.key) return true
        if (app.input.text.length == 0) return false
        return code["aliases"].filter(alias => alias.startsWith(app.input.text)).length > 0
    });
    displaySuggestions(filteredCodes);
}

function createSuggest(code) {
    const codeSpan = document.createElement("span");
    codeSpan.className = "suggestedText";
    codeSpan.textContent = code["id"];

    const keyDiv = document.createElement("div");
    keyDiv.className = "keystroke";
    keyDiv.textContent = code["view"];

    const plusSpan = document.createElement("span");
    plusSpan.classList.add("suggestedText");    
    plusSpan.classList.add("green");
    plusSpan.classList.add("hidden");
    plusSpan.textContent = "+";

    const suggestion = document.createElement("div");    
    suggestion.appendChild(codeSpan);
    suggestion.appendChild(keyDiv);
    suggestion.appendChild(plusSpan);    

    suggestion.className = "suggested"
    app.elements.suggest.appendChild(suggestion);

    suggestion.addEventListener("click", function () {
        app.elements.input.value = "";
        app.elements.suggest.innerHTML = "";

        const codeDiv = document.createElement("div");
        app.elements.view.appendChild(codeDiv);
        codeDiv.textContent = code["view"];
    });

    suggestion.addEventListener("mouseover", function () {
        plusSpan.classList.remove("hidden");
    });

    suggestion.addEventListener("mouseout", function () {
        plusSpan.classList.add("hidden");
    });
}

function displaySuggestions(codes) {
    app.elements.suggest.innerHTML = "";
    codes.forEach(code => createSuggest(code));
}