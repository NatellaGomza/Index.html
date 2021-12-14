$(document).ready(function () {
    updatePage();
    window.addEventListener("hashchange", updatePage);
})

function checkUpForm() {
    const mistake = document.getElementById("error");
    var value = userName.value;
    var validation = /^[A-ZА-ЯЁ]+$/i.test(value);
    if (value === "") {
        mistake.innerHTML = "Name is required";
        mistake.style.visibility = "visible";
        return false;
    }
    else if (!validation) {
        mistake.innerHTML = "Name should contain only letters";
        mistake.style.visibility = "visible";
        return false;
    } else {
        userName.style.borderColor = "rgb(253, 176, 9)";
        mistake.style.visibility = "hidden";
        return true;
    }
}

function openLevelPage(e) {
    e.preventDefault();
    window.location.hash = "Levels";
}

function renderStartPage(data) {
    let container = document.getElementById("mainPage");
    container.innerHTML = data;
    const userName = document.getElementById("userName");
    const sendButton = document.getElementById("sendButton");
    userName.addEventListener("keyup", checkUpForm);
    sendButton.addEventListener("click", function (e) {
        if (checkUpForm()) {
            openLevelPage(e);
            saveName();
        }
    });
}

function saveName() {
    let userName = document.getElementById("userName").value;
    localStorage.setItem("name", JSON.stringify(userName));
}

function renderLevelPage(data) {
    let container = document.getElementById("mainPage");
    container.innerHTML = data;
    getChoosenInput();
}

function renderGamePage(data) {
    let container = document.getElementById("mainPage");
    container.innerHTML = data;
    container.style.display = "block";
    let confettiScript = document.createElement('script');
    container.appendChild(confettiScript);
    confettiScript.src = "scripts/confetti.browser.min.js";
    let jsonJQuery = document.createElement('script');
    container.appendChild(jsonJQuery);
    jsonJQuery.src = "scripts/jquery-3.6.0.min.js";
    let script = document.createElement('script');
    container.appendChild(script);
    script.src = "scripts/game.js";
    let jsonScript = document.createElement('script');
    container.appendChild(jsonScript);
    jsonScript.src = "scripts/data.json";
}

function getChoosenInput() {
    const inputs = [...document.querySelectorAll(".selectedLevel")];
    inputs.forEach((item) => {
        item.addEventListener('change', function (e) {
            e.preventDefault();
            window.location.hash = "Game";
            let input = e.target.value;
            saveLevel(input);
        });
    });
}

function saveLevel(input) {
    let level = Number(input);
    localStorage.setItem("level", JSON.stringify(level));
}

function updatePage() {
    let hash = location.hash.substr(1);
    if (hash === "") {
        hash = "Start"
    }
    switch (hash) {
        case "Start":
            $.ajax(hash + ".html", {
                type: "GET",
                datatype: "html",
                success: renderStartPage,
            })
            break;
        case "Levels":
            $.ajax(hash + ".html", {
                type: "GET",
                datatype: "html",
                success: renderLevelPage,
            })
            break;
        case "Game":
            $.ajax(hash + ".html", {
                type: "GET",
                datatype: "html",
                success: renderGamePage,
            })
            break;
    }
}