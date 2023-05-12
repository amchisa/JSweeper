// Created by Alex Chisa, April-June 2023, ICS4U1a || MINESWEEPER Version 0.61

/* <------ TODO ------> 
1. Create dropdown menu for selecting difficulty and creating a game at the start
2. Add leaderboard which saves to a permanent file using best scores
	2.1. Make json which stores scores permanently
	2.2 Make script which sorts the json scores and displays them in the proper order in the HTML
	2.3 Script should check if user has reached a high score and ask for their name
3. Add help/informations screen (possibly activated with a key combination)
*/

/* <!------ DECLARING HTML ELEMENTS AND GLOBAL VARIABLES ------> */
let customInputs = document.querySelector("#customInputs");
let rowInput = document.querySelector("#rowsInput");
let columnInput = document.querySelector("#columnsInput");
let bombInput = document.querySelector("#bombsInput");
let flagDisplay = document.querySelector("#flags");
let timeDisplay = document.querySelector("#time");
let statusDisplay = document.querySelector("#status");
let questionMarks = document.querySelector("#questionMarks");
let intervalID = ""; // Declaring empty timerID --> Assigned to new timer
let gameData = { // GameData object --> Stores player and game information
    rows: 9,
    columns: 9,
    bombs: 10,
    flagsRemaining: 10,
    tilesRemaining: 71,
    time: 0,
    alive: true,
    debugMode: true, // Enable/Disable debugMode --> If enabled, additional game and tile information will be provided in the console
    initialClick: true,
    questionMarks: false,
    gameGrid: []
};

/* <!------ HTML FUNCTIONALITY ------> */
questionMarks.addEventListener("click", function() {
	gameData.questionMarks = !gameData.questionMarks; // Toggling question marks when checkbox is clicked
})
statusDisplay.addEventListener("mousedown", function() { 
	statusDisplay.getElementsByTagName('img')[0].src = "assets/textures/pressedface.png"; // Status face button is pressed on mouse down
});
statusDisplay.addEventListener("mouseup", function() {
	statusDisplay.getElementsByTagName('img')[0].src = "assets/textures/happyface.png"; // Status face button is back to normal on mouse up
	getData(); // Gets game data
	initGame(); // Starting new game
});
statusDisplay.addEventListener("mouseleave", function() {
    statusDisplay.getElementsByTagName('img')[0].src = "assets/textures/happyface.png"; // Status face button is back to normal if user moves mouse suddenly out of range
});

initGame(); // Creates an initial board on the page upon loading

/* <!------ FUNCTIONS ------> */
function initGame() { // Creates playing grid in HTML
    let gridMatrix = document.querySelector("#gridMatrix"); // Getting the HTML grid-matrix
	clearInterval(intervalID); // Stops timer
	gridMatrix.innerHTML = ""; // Clears grid
    gameData.alive = true; // Revives player
    gameData.initialClick = true; // Re-enables initial-click
    gameData.gameGrid = []; // Resets gamegrid matrix
    timeDisplay.innerHTML = // Resets timer display
        `<img src="assets/textures/display0.png" draggable="false">
        <img src="assets/textures/display0.png" draggable="false">
        <img src="assets/textures/display0.png" draggable="false">`; 
    let flagNumerals = ("000" + gameData.flagsRemaining).slice(-3).split(""); 
    flagDisplay.innerHTML = // Resets flag display
        `<img src="assets/textures/display${flagNumerals[0]}.png" draggable="false">
        <img src="assets/textures/display${flagNumerals[1]}.png" draggable="false">
        <img src="assets/textures/display${flagNumerals[2]}.png" draggable="false">`;
    appendTile("happyface", statusDisplay); // Resets status to default value (happyface)
	console.clear(); // Clears console

    for (let y = 0; y < gameData.rows; y++) {
        gameData.gameGrid[y] = []; // Empty array for each row
        for (let x = 0; x < gameData.columns; x++) { 
            gameData.gameGrid[y][x] = ""; // Empty value for each cell
        }
    }

    for (let tr = 0; tr < gameData.rows; tr++) {
        let row = gridMatrix.insertRow(); // Inserts row into HTML
        for (let td = 0; td < gameData.columns; td++) { 
            let tile = row.insertCell(); // Inserts cell into row
            tile.innerHTML = '<img src="assets/textures/coveredtile.png" draggable="false">'; // Adds blank tile for every space on the grid
            tile.id = [tr, td]; // Gives each tile a unique id 
            tile.addEventListener("mouseup", clickTile, false); // Event listener for the user's mouse click (mouseup)
            tile.addEventListener("mousedown", clickTile, false); // Event listener for the user's mouse click (mouseup)
        }
    }
}

function getData() { // Obtains gameData from the user when new values are introduced
    customInputs.setAttribute("hidden", "true"); // Hide custom inputs automatically when getData is called
    let difficulty = document.querySelector("#selectDifficulty").value;

    switch (difficulty) {
        case "beginner": // Beginner difficulty settings
            gameData.rows = 9;
            gameData.columns = 9;
            gameData.bombs = 10;
            break;

        case "intermediate": // Intermediate difficulty settings
            gameData.rows = 16;
            gameData.columns = 16;
            gameData.bombs = 40;
            break;

        case "expert": // Expert difficulty settings
            gameData.rows = 16;
            gameData.columns = 30;
            gameData.bombs = 99;
            break;

        case "custom": // Custom difficulty settings
            customInputs.removeAttribute("hidden"); // Reveals custom difficulty options
            gameData.rows = rowInput.value;
            gameData.columns = columnInput.value;
            gameData.bombs = bombInput.value;

			if (gameData.columns < 8) { // Min Columns
				gameData.columns = 8; 
				columnInput.value = 8;
			} else if (gameData.columns > 30) { // Max Columns
				gameData.columns = 30; 
				columnInput.value = 30;
			}
			if (gameData.rows < 1) { // Min rows
				gameData.rows = 1; 
				rowInput.value = 1;
			} else if (gameData.rows > 30) { // Max rows
				gameData.rows = 30; 
				rowInput.value = 30;
			}
		
			if (gameData.bombs < 0) { // Min bombs
				gameData.bombs = 0; 
				bombInput.value = 0;
			} else if (gameData.bombs >= gameData.rows * gameData.columns) {  // Max bombs
				gameData.bombs = (gameData.rows * gameData.columns) - 1;
				bombInput.value = gameData.bombs;
			}
            break;
    }

    gameData.flagsRemaining = gameData.bombs; // How many flags the player has to place (visible)
    gameData.tilesRemaining = ((gameData.columns * gameData.rows) - gameData.bombs); // How many tiles without bombs are left (hidden)
}

function generateGrid(sourceID) { // Generates a random game grid
    gameData.time = 0; // Resets game time 
    intervalID = setInterval(function() { // Starts game timer (1 sec = 1000 ms)
        gameData.time++;
        let timeNumerals = ("000" + gameData.time).slice(-3).split(""); 
        timeDisplay.innerHTML = // Appends time display by slicing off last 3 values from the combined string generated
            `<img src="assets/textures/display${timeNumerals[0]}.png" draggable="false">
            <img src="assets/textures/display${timeNumerals[1]}.png" draggable="false">
            <img src="assets/textures/display${timeNumerals[2]}.png" draggable="false">`;
    }, 1000);

    let surroundingTiles = generateSurroudingTiles(sourceID);
    let possibleTiles = (gameData.columns * gameData.rows) - gameData.bombs - 1; // Possible tiles avaliable to be cleared
    surroundingTiles = surroundingTiles.slice(0, possibleTiles).map(String); // Slices off excess surrounding tiles based on possibleTiles

    for (let i = 0; i < gameData.bombs; i++) { // Creates random distribution of bombs
        let bombXcoordinate = Math.floor(Math.random() * gameData.columns); // Random X coordinate for bomb
        let bombYcoordinate = Math.floor(Math.random() * gameData.rows); // Random Y coordinate for bomb
        let gridState = gameData.gameGrid[bombYcoordinate][bombXcoordinate]; // Getting the gridstate at coordinates

        if (gridState == "bomb" || sourceID[0] == bombYcoordinate && sourceID[1] == bombXcoordinate) { // Checking whether bomb has already been generated
            i--; // Regenerates bomb position 
        } else if (surroundingTiles.includes(bombYcoordinate + "," + bombXcoordinate)) { // Checking if bomb is in surrounding tiles
            i--; // Regenerates bomb position
        } else {
            gameData.gameGrid[bombYcoordinate][bombXcoordinate] = "bomb"; // Creates new bomb
        }
    }

    for (let y = 0; y < gameData.rows; y++) {
        for (let x = 0; x < gameData.columns; x++) {
            if (isBomb(x, y) != 1) {
                let bombsSurrounding = ( // Adding up number of bombs in surrounding tiles
                    isBomb(x - 1, y - 1) // Top left 
                    + isBomb(x, y - 1) // Top center
                    + isBomb(x + 1, y - 1) // Top right
                    + isBomb(x - 1, y) // Center left
                    + isBomb(x + 1, y) // Center right
                    + isBomb(x - 1, y + 1) // Bottom left
                    + isBomb(x, y + 1) // Bottom center
                    + isBomb(x + 1, y + 1) // Bottom right
                );

                gameData.gameGrid[y][x] = bombsSurrounding; // Sets the value of the tile on the gameGrid to the number of bombs around it
            }
        }
    }
    gameData.initialClick = true; // Sets initial click to true

	gameData.debugMode ? console.info(gameData.gameGrid) : null; // Log game grid matrix in console if debugMode is true
}

function clickTile(e) { // Responds to player click event and does the corresponding action
    let sourceID = this.id; // Finds sourceID
    let tile = document.getElementById(sourceID); // Finds the tile using its sourceID
	sourceID = sourceID.split(","); // Splits ID into set of coordinates that can be used to locate the corresponding value on the gameGrid

    if (gameData.initialClick && e.which == 1 && e.type == "mouseup") {
        generateGrid(sourceID); // Generates random grid
        gameData.initialClick = false; // Initial click is false
    }

    let tileState = tileImage(tile); // Finding what asset is present on the tile
    let gridState = gameData.gameGrid[sourceID[0]][sourceID[1]]; // Find tile cell position in the gameGrid

    if (e.which == 1 && e.type == "mouseup") {
        appendTile("happyface", statusDisplay);
		gameData.debugMode ? console.info(sourceID) : null // Logs sourceID of tile clicked if debugMode is true

        if (tileState != "flag" && gridState != "bomb") { // If there is no bomb or flag preventing a click, reveal the state of the tile underneith
            clearTiles(sourceID); // Clears tile which user has clicked on
            checkWinCondition(); // Checks whether the game has been won

        } else if (tileState != "flag" && gridState == "bomb") { // If the tile is not a flag and the tile is in fact a bomb, lose the game and show all mines
            gameData.alive = false; // Player dies
            checkWinCondition(); // Checks whether the game has been won
            appendTile(("exploded" + gameData.gameGrid[sourceID[0]][sourceID[1]]), tile); // Appends the tile with the exploded mine asset
        }

    } else if (e.which == 1 && e.type == "mousedown" && tileState != "flag") {
        appendTile("suspenseface", statusDisplay); // Appends suspense face on left mouse down

    } else if (e.which == 3 && e.type == "mousedown") {
        switch (tileState) {
            case "coveredtile": 
                appendTile("flag", tile);
                gameData.flagsRemaining--; // Subtracts from flags remaining
                checkWinCondition();
                break;

            case "flag":
                if (gameData.questionMarks) { 
                    appendTile("questionmark", tile); // Append question mark if it is selected
                } else {
                    appendTile("coveredtile", tile); // Remove flag
                }

                gameData.flagsRemaining++; // Add to flags remaining
                break;

            case "questionmark":
                appendTile("coveredtile", tile); // Remove question mark
                break;
        }

        let flagNumerals = ""; // Declairing empty flagNumerals variable

        if (gameData.flagsRemaining >= 0) { // Positive values
            flagNumerals = ("000" + gameData.flagsRemaining).slice(-3).split("");
        } else { // Negative Values
            flagNumerals = ("-" + ("00" + Math.abs(gameData.flagsRemaining)).slice(-2)).split("");
        }

        flagDisplay.innerHTML = // Update flag display with the last 3 values of the combined array generated
            `<img src="assets/textures/display${flagNumerals[0]}.png" draggable="false">
            <img src="assets/textures/display${flagNumerals[1]}.png" draggable="false">
            <img src="assets/textures/display${flagNumerals[2]}.png" draggable="false">`

		gameData.debugMode ? console.info("Tiles Remaining: " + gameData.tilesRemaining) : null // Log tiles remaining if debugMode is true
    }
}

function generateSurroudingTiles(sourceID) {
    let surroundingTiles = ([
        [Number(sourceID[0]) - 1, Number(sourceID[1]) - 1], // Top Left
        [Number(sourceID[0]) - 1, Number(sourceID[1])], // Top Center
        [Number(sourceID[0]) - 1, Number(sourceID[1]) + 1], // Top Right
        [Number(sourceID[0]), Number(sourceID[1]) - 1], // Center Left
        [Number(sourceID[0]), Number(sourceID[1]) + 1], // Center Right
        [Number(sourceID[0]) + 1, Number(sourceID[1]) - 1], // Bottom Left
        [Number(sourceID[0]) + 1, Number(sourceID[1])], // Bottom Center
        [Number(sourceID[0]) + 1, Number(sourceID[1]) + 1] // Bottom Right
    ]);

    for (let i = 0; i < surroundingTiles.length; i++) {
        if (!inBounds(surroundingTiles[i][1], surroundingTiles[i][0])) {
            surroundingTiles[i] = ""; // Removes surrounding tile if it is out of bounds
        }
    }

    surroundingTiles = surroundingTiles.filter(Boolean); // Filters all undefined out of bounds surrounding tiles out of array
    return surroundingTiles; // Return correct surrounding tiles
}

function inBounds(x, y) { // Checks whether tile is out of bounds
    if (x >= 0 && y >= 0 && x < gameData.columns && y < gameData.rows) {
        return true; // Tile is in bounds
    }
    return false; // Tile is out of bounds
}

function isBomb(x, y) { // Returns value of a coordinate on the game grid
    if (inBounds(x, y)) { // Making sure coordinates don't fall outside of the grid
        let gridState = gameData.gameGrid[y][x]; // Finds gridstate
        if (gridState == "bomb") {
            return 1; // Returns 1 if there is a bomb in that location
        }
    }
    return 0; // Returns 0 if there is no bomb and/or out of bounds
}

function tileImage(img) { // Grabs asset name from the inlineHTML
    let imageComponents = String(img.innerHTML).split(/["/.]/); // Splits asset's image tag into parts at quote mark ("), slash (/), and dot(.)
    return imageComponents[3]; // Returns asset/image name
}

function appendTile(asset, tile) { // Appends tile with the proper asset
    tile.innerHTML = `<img src="assets/textures/${asset}.png" draggable="false">`; // Appends asset name in the proper place
}

function winlose(state) { // Flags all unflagged mines if the user wins the game <---> Reveals all mines if the user loses the game
    for (let i = 0; i < gameData.rows; i++) {
        for (let j = 0; j < gameData.columns; j++) { // Going through every tile on the gameGrid to find all the bomb positions
            let gridState = gameData.gameGrid[i][j]; // Current grid state, i.e. mine, number (1-8), empty
            let tile = document.getElementById(i + "," + j);
            switch (state) {
                case "lose":
                    if (gridState == "bomb" && tileImage(tile) != "flag" && state == "lose") { 
                        appendTile("bomb", tile); // If the tile is a bomb and doesn't have a flag on it, show a regular bomb
                    } else if (gridState != "bomb" && tileImage(tile) == "flag" && state == "lose") { 
                        appendTile("notabomb", tile); // If the tile isn't a bomb and is flagged, show a bomb with an x through it
                    }
                    break;

                case "win":
                    if (gridState == "bomb" && tileImage(tile) != "flag") { 
                        appendTile("flag", tile); // If the tile is a bomb and doesn't have a flag on it, put a flag on it
                        gameData.flagsRemaining--; // Substract from flags remaining
                    }
                    break;
            }
        }
    }

    switch (state) {
        case "lose":
            appendTile("deadface", statusDisplay); // Player has lost --> Append status with dead face 
            break;
        case "win":
            let flagNumerals = ("000" + gameData.flagsRemaining).slice(-3).split(""); 
            flagDisplay.innerHTML = // Resets flag display
                `<img src="assets/textures/display${flagNumerals[0]}.png" draggable="false">
                <img src="assets/textures/display${flagNumerals[1]}.png" draggable="false">
                <img src="assets/textures/display${flagNumerals[2]}.png" draggable="false">`;
            appendTile("sunglassesface", statusDisplay); // Player has won --> Append status with sunglasses face
            break;
    }

    clearInterval(intervalID); // Stops timer
    removeEventListeners();
}

function removeEventListeners() { // Removes all tile event listeners
    for (let i = 0; i < gameData.rows; i++) {
        for (let j = 0; j < gameData.columns; j++) {
            let tile = document.getElementById(i + "," + j);
            tile.removeEventListener("mouseup", clickTile);
            tile.removeEventListener("mousedown", clickTile);
        }
    }
}

function clearTiles(sourceID) { // Clears respective tile
    if (sourceID == undefined) { 
        return; // Omits undefined sourceIDs --> Doesn't affect tile clearing
    }
    try {
        let tile = document.getElementById(sourceID[0] + "," + sourceID[1]); // Gets tile
        let gridState = String(gameData.gameGrid[sourceID[0]][sourceID[1]]); // Gets string of cell value

        if (tileImage(tile) == "coveredtile" || tileImage(tile) == "questionmark") {
            appendTile("uncovered" + gridState, tile); // Appends tile with proper asset --> (uncovered0-8)
            gameData.tilesRemaining--; // Subtracts from tiles remaning
            tile.removeEventListener("mousedown", clickTile); // Removes mousedown event listener --> Associated with status changing from happy to suspence faces

            if (gridState == "0") {
                let surroundingTiles = generateSurroudingTiles(sourceID); // Gets surrounding tiles if tile click on is empty
                for (let i = 0; i <= surroundingTiles.length; i++) {
                    try {
                        clearTiles(surroundingTiles[i]); // Clears surrounding tiles recursively
                    } catch (error) {
						gameData.debugMode ? console.warn("Could not clear a tile at: " + sourceID[0] + ":" + sourceID[1]) : null; 
                        return;
                    }
                }
            }
        }
    } catch (error) {
		gameData.debugMode ? console.warn("Error finding a tile using sourceID: " + sourceID[0] + ":" + sourceID[1]) : null;
        return; // Omits error --> Doesn't affect tile clearing
    }
}

function checkWinCondition() { // Checks various win conditions against the variables present in the gameData object
	if (gameData.tilesRemaining == 0) {
        winlose("win"); // Player loses
		gameData.debugMode ? console.log("You Win! Your time was: " + gameData.time + " seconds") : null; 
    } else if (gameData.alive == false) {
        winlose("lose"); // Player wins
        gameData.debugMode ? console.log("You have died. Your time was: " + gameData.time + " seconds") : null;
    }
}