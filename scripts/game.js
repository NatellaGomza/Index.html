(function () {
  let playingField;
  let controller;
  let model;

  $(document).ready(function () {
    $.getJSON('./scripts/data.json', function (jd) {
      let sourcesForInput = jd;

      playingField = new PlayingField(sourcesForInput);
      controller = new Controller();
      model = new Model();

      playingField.selectSources();
      playingField.preloadImages(playingField.sourcesForPuzzle, playingField.testLoaded);
      playingField.shuffle();
      playingField.buildingCells();
      playingField.updateScore();
      controller.changeGameLevel();
      controller.changePlayer();
      controller.closeResultsTable();

      canvas.addEventListener("mousedown", controller.mouseDown);
      canvas.addEventListener("mousemove", controller.mouseMove);
      canvas.addEventListener("mouseup", controller.mouseUp);
      canvas.addEventListener("mouseup", controller.check);
      window.addEventListener("resize", playingField.draw, false);
    });
  })

  class Model {
    constructor() {
      this.score = 0;
      this.seconds = 0;
      this.minutes = 0;
      this.hours = 0;
      this.spendTime = true;
      this.interval = setInterval(this.countTime.bind(this), 1000);
      this.userName;
      this.gameMoves;
      this.spentTimeInSecs;
      this.gameId;
      this.dataBaseName = 'GNR_PUZZLELAND_GAME_DATA';
      this.dataBaseServerURL = "https://fe.it-academy.by/AjaxStringStorage2.php";
      this.updatePassword;
      this.data = [];
    }

    countTime() {
      if (this.spendTime) {
        this.seconds += 1;

        if (this.seconds > 59) {
          this.seconds = 0;
          this.minutes += 1
        }

        if (this.minutes > 59) {
          this.minutes = 0;
          this.hours += 1;
        }
      }
      playingField.updateTimer();
    }

    stopTimer() {
      clearTimeout(this.interval);
    }

    checkUp() {
      let counter = 0;
      for (let j = 0; j < playingField.arrayLeft.length; j++) {
        let b = playingField.arrayLeft[j];
        if (b.isChecked === true) {
          counter++;
        }
      }
      if (counter === playingField.ammount * playingField.ammount) {
        controller.removeListeners();
        model.stopTimer();
        playingField.showModal();
        playingField.frame();
        setTimeout(() => window.cancelAnimationFrame(playingField.anim), 3000);
        this.setUserResult();
        this.saveWinner();
        let audio = new Audio('../sounds/congratulations.mp3');
        audio.play();
      }
    }

    setUserResult() {
      let finishScore = this.score;
      let finishTime = this.hours * 3600 + this.minutes * 60 + this.seconds;
      localStorage.setItem("score", JSON.stringify(finishScore));
      localStorage.setItem("time", JSON.stringify(finishTime));
    }

    getWinnerData() {
      this.userName = JSON.parse(localStorage.getItem('name'));
      this.gameMoves = JSON.parse(localStorage.getItem('score'));
      this.spentTimeInSecs = JSON.parse(localStorage.getItem('time'));
      this.gameId = JSON.parse(localStorage.getItem('level'));
      return {
        userName: this.userName,
        gameId: this.gameId,
        gameMoves: this.gameMoves,
        spentTimeInSecs: this.spentTimeInSecs,
        gameFinishedTimestamp: new Date().getTime(),
      }
    }

    saveWinner() {
      model.updatePassword = Math.random();
      $.ajax({
        url: model.dataBaseServerURL, type: 'POST', cache: false, dataType: 'json', async: false,
        data: { f: 'LOCKGET', n: model.dataBaseName, p: model.updatePassword },
        success: model.lockGetReady, error: model.errorHandler
      }
      );
    }

    lockGetReady(callresult) {
      let winner = model.getWinnerData();
      if (winner) {
        model.data = JSON.parse(callresult.result);
        if (model.data && model.data.winners) {
          model.data.winners.push(winner);
        }
      }

      playingField.drawTableOfPlayers(model.data.winners, winner)
      // $.ajax({
      //   url: model.dataBaseServerURL, type: 'POST', cache: false, dataType: 'json',
      //   data: { f: 'UPDATE', n: model.dataBaseName, v: JSON.stringify(model.data), p: model.updatePassword },
      //   success: playingField.drawTableOfPlayers(model.data.winners, winner), error: model.errorHandler
      // });
    }

    updateReady(callresult) {
      console.log(callresult);
    }

    errorHandler(statusStr, errorStr) {
      console.log(statusStr + ' ' + errorStr);
    }

    restoreInfo() {
      $.ajax({
        url: model.dataBaseServerURL, type: 'POST', cache: false, dataType: 'json', async: false,
        data: { f: 'READ', n: model.dataBaseName },
        success: model.readReady, error: model.errorHandler
      }
      );
    }

    readReady(callresult) {
      if (callresult.error != undefined) {
        console.log(callresult.error);
      } else if (callresult.result != '') {
        recordsmans = JSON.parse(callresult.result);
      }
    }
  }

  class PlayingField {
    constructor(sourcesForInput) {
      this.canvas = document.getElementById("canvas");
      this.ctx = canvas.getContext("2d");
      this.scoreField = document.getElementById("score");
      this.timeField = document.getElementById("timer");
      this.modal = document.getElementById("modal");
      this.sourcesForInput = sourcesForInput;
      this.startPointXLeft;
      this.startPointXRight;
      this.startPointY;
      this.sizeOfField;
      this.arrayLeft = [];
      this.arrayRight = [];
      this.canvas.width;
      this.canvas.height;
      this.imagesArr = [];
      this.sourcesForPuzzle = [];
      this.level;
      this.ammount;
      this.anim;
    }

    preloadImages(sources, callback) {

      let counter = 0;

      function onLoad() {
        counter++;
        if (counter == sources.length) callback();
      }

      let k = 0
      for (let source of sources) {
        let img = document.createElement("img");
        img.onload = img.onerror = onLoad;
        img.src = source.src;
        img.value = source.value;
        this.imagesArr.push(img);
      };
      k++;
    }

    selectSources() {
      this.level = JSON.parse(localStorage.getItem("level"));
      switch (this.level) {
        case 1:
          this.sourcesForPuzzle = this.sourcesForInput.sourcesForInput1;
          this.ammount = 3;
          break;
        case 2:
          this.sourcesForPuzzle = this.sourcesForInput.sourcesForInput2;
          this.ammount = 4;
          break;
        case 3:
          this.sourcesForPuzzle = this.sourcesForInput.sourcesForInput3;
          this.ammount = 5;
          break;
        case 4:
          this.sourcesForPuzzle = this.sourcesForInput.sourcesForInput4;
          this.ammount = 3;
          break;
        case 5:
          this.sourcesForPuzzle = this.sourcesForInput.sourcesForInput5;
          this.ammount = 4;
          break;
        case 6:
          this.sourcesForPuzzle = this.sourcesForInput.sourcesForInput6;
          this.ammount = 5;
          break;
        case 7:
          this.sourcesForPuzzle = this.sourcesForInput.sourcesForInput7;
          this.ammount = 3;
          break;
        case 8:
          this.sourcesForPuzzle = this.sourcesForInput.sourcesForInput8;
          this.ammount = 4;
          break;
        case 9:
          this.sourcesForPuzzle = this.sourcesForInput.sourcesForInput9;
          this.ammount = 5;
          break;
      }
    }

    testLoaded() {
      for (let i = 0; i < playingField.sourcesForPuzzle.length; i++) {
        let img = document.createElement('img');
        img.src = playingField.sourcesForPuzzle[i].src;
      }
      playingField.draw();
    }

    shuffle() {
      this.imagesArr.sort(() => Math.random() - 0.5);
    }

    buildingCells() {
      if (window.screen.width > 1200) {
        this.canvas.width = Math.floor(window.innerWidth * 0.95);
      } else if (window.screen.width <= 1200) {
        this.canvas.width = Math.floor(window.screen.width * 0.85);
      };
      if (window.screen.height > 600) {
        this.canvas.height = Math.floor(window.innerHeight * 0.85);
      } else if (window.screen.height <= 600) {
        this.canvas.height = Math.floor(window.screen.height * 0.85);
      };

      this.sizeOfField = Math.floor(this.canvas.width * 0.4);
      this.startPointXLeft = Math.floor(this.canvas.width * 0.05);
      this.startPointXRight = Math.floor(this.canvas.width * 0.55);
      this.startPointY = Math.floor((this.canvas.height - this.sizeOfField) / 2);
      this.sizeOfCell = this.sizeOfField / this.ammount;

      let k = 0;

      for (let j = 0; j < this.ammount; j++) {
        for (let i = 0; i < this.ammount; i++) {
          const xLeft = Math.floor(i % this.ammount * this.sizeOfCell + this.startPointXLeft);
          const xRight = Math.floor(i % this.ammount * this.sizeOfCell + this.startPointXRight);
          const y = Math.floor(j % this.ammount * this.sizeOfCell + this.startPointY);
          this.arrayLeft.push({
            x: xLeft,
            y: y,
            s: this.sizeOfCell,
            isEmpty: true
          });
          this.arrayRight.push({
            x: xRight,
            y: y,
            s: this.sizeOfCell,
            startIndex: k,
          });
          k++;
        }
      }
    }

    draw() {

      this.canvas = document.getElementById("canvas");
      this.ctx = canvas.getContext("2d");

      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = 0; i < this.arrayLeft.length; i++) {
        let b = this.arrayLeft[i];
        if (b.x === this.startPointXLeft) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.startPointXLeft, b.y);
          this.ctx.lineTo(this.sizeOfField + b.x, b.y);
          this.ctx.closePath();
          this.ctx.strokeStyle = "grey";
          this.ctx.stroke();
        }
        if (b.y === this.startPointY) {
          this.ctx.beginPath();
          this.ctx.moveTo(b.x, this.startPointY);
          this.ctx.lineTo(b.x, this.sizeOfField + b.y);
          this.ctx.closePath();
          this.ctx.strokeStyle = "grey";
          this.ctx.stroke();
        }
        b.value = i;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(this.startPointXLeft + this.sizeOfField, this.startPointY);
      this.ctx.lineTo(this.startPointXLeft + this.sizeOfField, this.startPointY + this.sizeOfField);
      this.ctx.closePath();
      this.ctx.strokeStyle = "grey";
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(this.startPointXLeft, this.startPointY + this.sizeOfField,);
      this.ctx.lineTo(this.startPointXLeft + this.sizeOfField, this.startPointY + this.sizeOfField);
      this.ctx.closePath();
      this.ctx.strokeStyle = "grey";
      this.ctx.stroke();

      for (let j = 0; j < this.arrayRight.length; j++) {
        let a = this.arrayRight[j];
        this.ctx.drawImage(this.imagesArr[this.arrayRight[j].startIndex], a.x, a.y, a.s, a.s);
        a.value = this.imagesArr[this.arrayRight[j].startIndex].value;
      }
    }

    updateScore() {
      let scoreString = `You have made ${model.score} moves`;
      this.scoreField.innerHTML = scoreString;
    }

    updateTimer() {
      this.timeField.innerHTML = `Time spend ${model.hours} : ${model.minutes.toString().padStart(2, '0')} : ${model.seconds.toString().padStart(2, '0')}`;
    }

    showModal() {
      this.modal.style.display = "block";
    }

    hideModal() {
      playingField.modal.style.display = "none";
    }

    drawTableOfPlayers(winners, userResult) {
      let winnersInLevel = [];
      let searchTerm = JSON.parse(localStorage.getItem('level'))

      let table = document.getElementById('table');
      let caption = document.createElement('caption');
      caption.innerHTML = "Best results: ";
      table.appendChild(caption);

      let tr = document.createElement("tr");
      tr.classList.add("header");
      let td = document.createElement("td");
      td.innerHTML = "Place";
      td.classList.add("tablePlace");
      tr.appendChild(td);

      td = document.createElement("td");
      td.innerHTML = "Name";
      td.classList.add("tableName");
      tr.appendChild(td);

      td = document.createElement("td");
      td.innerHTML = "Spend Time";
      td.classList.add("tableSpendTime");
      tr.appendChild(td);

      td = document.createElement("td");
      td.innerHTML = "Moves";
      td.classList.add("tableMoves");
      tr.appendChild(td);

      td = document.createElement("td");
      td.innerHTML = "Date";
      td.classList.add("tableDate");
      tr.appendChild(td);
      table.appendChild(tr);

      winnersInLevel = winners.filter((users) => users.gameId === searchTerm);

      winnersInLevel.sort(function (a, b) {
        return a.spentTimeInSecs - b.spentTimeInSecs || a.gameMoves - b.gameMoves;
      });
      winnersInLevel.forEach((item) => {
        item.gameFinishedTimestamp = `${new Date(item.gameFinishedTimestamp).toISOString().slice(11, 19)} ${new Date(item.gameFinishedTimestamp).toISOString().slice(0, 10)}`
        let hours = Math.floor(item.spentTimeInSecs / 60 / 60);
        let minutes = Math.floor(item.spentTimeInSecs / 60) - hours * 60;
        let seconds = item.spentTimeInSecs % 60;
        item.spentTimeInSecs = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      });

      let usersResults = winnersInLevel.findIndex((users) => users.userName === userResult.userName && users.gameFinishedTimestamp === userResult.gameFinishedTimestamp);

      for (let i = 0; i < winnersInLevel.length; i++) {

        let tr = document.createElement("tr");
        let td = document.createElement("td");
        td.innerHTML = i + 1;
        td.classList.add("tablePlace");
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = winnersInLevel[i].userName;
        td.classList.add("tableName");
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = winnersInLevel[i].spentTimeInSecs;
        td.classList.add("tableSpendTime");
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = winnersInLevel[i].gameMoves;
        td.classList.add("tableMoves");
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = winnersInLevel[i].gameFinishedTimestamp;
        td.classList.add("tableDate");
        tr.appendChild(td);

        if (usersResults === i) {
          tr.style.color = "#d11c1c";
        }

        table.appendChild(tr);
      }
    }

    frame() {
      let colors = ["#FF1493", "#00FFFF"];
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });
      this.anim = requestAnimationFrame(() => this.frame());
    }
  }

  class Controller {
    constructor() {
      this.canvas = document.getElementById("canvas");
      this.width = canvas.width;
      this.height = canvas.height;
      this.puzzleActive = null;
      this.activePuzzleIsDetectedButNotProcessed;
      this.distanceX;
      this.distanceY;
      this.startX;
      this.startY;
    }

    mouseDown(e) {
      e.preventDefault();
      e.stopPropagation();

      let coords = canvas.getBoundingClientRect();
      let offsetX = coords.left;
      let offsetY = coords.top;
      let mouseX = parseInt(e.clientX - offsetX);
      let mouseY = parseInt(e.clientY - offsetY);

      for (let i = playingField.arrayRight.length - 1; i >= 0; i--) {
        let a = playingField.arrayRight[i];
        if (mouseX > a.x && mouseX < a.x + a.s && mouseY > a.y && mouseY < a.y + a.s) {
          this.distanceX = mouseX - a.x;
          this.distanceY = mouseY - a.y;
          this.puzzleActive = JSON.parse(JSON.stringify(playingField.arrayRight[i]));
          this.activePuzzleIsDetectedButNotProcessed = true;
          model.score++;
          break;
        }
      }

      this.startX = mouseX;
      this.startY = mouseY;

      for (let j = 0; j < playingField.arrayLeft.length; j++) {
        let b = playingField.arrayLeft[j];
        if (mouseX > b.x && mouseX < b.x + b.s && mouseY > b.y && mouseY < b.y + b.s) {
          b.isEmpty = true;
        }
      }
    }

    mouseMove(e) {

      let coords = canvas.getBoundingClientRect();
      let offsetX = coords.left;
      let offsetY = coords.top;
      let mouseX = parseInt(e.clientX - offsetX);
      let mouseY = parseInt(e.clientY - offsetY);
      let distanceCoveredX = mouseX - this.startX;
      let distanceCoveredY = mouseY - this.startY;

      const leftMouseButtonOnlyDown = e.buttons === undefined
        ? e.which === 1
        : e.buttons === 1;
      if (leftMouseButtonOnlyDown) {

        if (this.activePuzzleIsDetectedButNotProcessed) {
          let index = playingField.arrayRight.findIndex((el, index) => {
            if (el.startIndex === this.puzzleActive.startIndex) {
              return true;
            }
          });
          let item = playingField.arrayRight.splice(index, 1)[0];
          playingField.arrayRight.push(item);
          this.activePuzzleIsDetectedButNotProcessed = false;
        };

        if (this.puzzleActive !== null) {
          let a = playingField.arrayRight[playingField.arrayRight.length - 1];
          if (a.x <= 0) {
            a.x = 1;
          } else if (a.x >= this.width - a.s) {
            a.x = this.width - a.s - 1;
          } else if (a.y >= this.height - a.s) {
            a.y = this.height - a.s - 1;
          }
          else if (a.y <= 0) {
            a.y = 1;
          }
          else {
            a.x += distanceCoveredX;
            a.y += distanceCoveredY;
          }
        }

        this.startX = mouseX;
        this.startY = mouseY;
        playingField.draw();
      }
    }

    mouseUp(e) {

      playingField.updateScore();

      let coords = canvas.getBoundingClientRect();
      let offsetX = coords.left;
      let offsetY = coords.top;
      let mouseX = parseInt(e.clientX - offsetX);
      let mouseY = parseInt(e.clientY - offsetY);
      for (let j = 0; j < playingField.arrayLeft.length; j++) {
        let b = playingField.arrayLeft[j];
        let a = playingField.arrayRight[playingField.arrayRight.length - 1];
        let audio = new Audio('../sounds/mouseUp.mp3');
        let rightBorder = playingField.arrayLeft[playingField.arrayLeft.length - 1].x + playingField.arrayLeft[playingField.arrayLeft.length - 1].s;
        let bottomBorder = playingField.arrayLeft[playingField.arrayLeft.length - 1].y + playingField.arrayLeft[playingField.arrayLeft.length - 1].s;
        if (mouseX > b.x && mouseX < b.x + b.s && mouseY > b.y && mouseY < b.y + b.s && b.isEmpty && this.puzzleActive) {
          a.x = b.x;
          a.y = b.y;
          b.isEmpty = false;
          if (a.value === b.value) {
            b.isChecked = true;
          }
        } else if (((mouseX > b.x && mouseX < b.x + b.s && mouseY > b.y && mouseY < b.y + b.s && !b.isEmpty) ||
          (mouseX < rightBorder + this.distanceX && mouseX > rightBorder) || mouseX < playingField.arrayLeft[0].x || mouseY < playingField.arrayLeft[0].y || mouseY > bottomBorder)
          && this.puzzleActive) {
          a.x = this.puzzleActive.x;
          a.y = this.puzzleActive.y;
          let cellToBeNotEmpty = playingField.arrayLeft.find(item => item.x === a.x && item.y === a.y);
          if (cellToBeNotEmpty) {
            cellToBeNotEmpty.isEmpty = false;
          }
        }
        if (this.puzzleActive) {
          audio.play();
        }
      }
      playingField.draw();
      this.puzzleActive = null;
    }

    check() {
      setTimeout(() => model.checkUp(), 1000);
    }

    changeGameLevel() {
      let changeLevel = document.getElementById("changeLevel");
      changeLevel.addEventListener("click", function () {
        window.location.hash = "Levels";
        let hash = location.hash.substr(1);
        $.ajax(hash + ".html", {
          type: "GET",
          datatype: "html",
          success: renderLevel,
        });
      });
    }

    changePlayer() {
      let changePlayer = document.getElementById("changePlayer");
      changePlayer.innerHTML = `${JSON.parse(localStorage.getItem('name'))}, change player`;
      changePlayer.addEventListener("click", function () {
        window.location.hash = "Start";
        let hash = location.hash.substr(1);
        $.ajax(hash + ".html", {
          type: "GET",
          datatype: "html",
          success: renderLevel,
        });
      });
    }

    closeResultsTable() {
      let closeButton = document.getElementById("closeButton");
      closeButton.addEventListener("click", playingField.hideModal);
    }

    removeListeners() {
      canvas.removeEventListener("mousedown", controller.mouseDown);
      canvas.removeEventListener("mousemove", controller.mouseMove);
      canvas.removeEventListener("mouseup", controller.mouseUp);
      canvas.removeEventListener("mouseup", controller.check);
    }
  }
}())
