// Created by Alex Chisa, April-June 2023, ICS4U1a || MINESWEEPER Version 0.31

/* ==== Bugs ====

#01: 

*/

/* ==== TODO ====

1. Add more event listeners which on mouse down allow the specific tile to be a empty tile, without revealing its true state
2. Add life status using the smiley face, which can also serve as a button which, when pressed, restarts the game
3. Add leaderboard which saves to a permanent file using best scores
4. Hovering over question mark while left click is pressed shows the question mark pressed down tile 
5. Texture atlas (merge all textures onto one image) for better performance

*/

let gameData = { // GameData object --> Stores player and game information
	rows: 9,
	columns: 9,
	bombs: 10,
	flagsRemaining: 10,
	tilesRemaining: 71,
	time: 0,
	alive: true,
	debugMode: true, // Enable debugMode --> additional game and tile information will be provided in the console
	initialClick: true,
	questionMarks: false,
	gameGrid: []
};

// Importing DOM elements for manipulation
let customInputs = document.querySelector("#customInputs");
let rowInput = document.querySelector("#rowsInput");
let columnInput = document.querySelector("#columnsInput");
let bombInput = document.querySelector("#bombsInput");
let flagDisplay = document.querySelector("#flags");
let timeDisplay = document.querySelector("#time");
let statusDisplay = document.querySelector("#status");

let intervalID = ""; // Declaring empty variable for use in the timer

function clearTimer() { // Stops timer
	clearInterval(intervalID);
}

function getData() { // Obtains gameData from the user when new values are introduced
	customInputs.setAttribute("hidden", "true");
	let difficulty = document.querySelector("#selectDifficulty").value;

	switch (difficulty) {
		case "beginner":
			gameData.rows = 9;
			gameData.columns = 9;
			gameData.bombs = 10;
			break;

		case "intermediate":
			gameData.rows = 16;
			gameData.columns = 16;
			gameData.bombs = 40;
			break;

		case "expert":
			gameData.rows = 16;
			gameData.columns = 30;
			gameData.bombs = 99;
			break;

		case "custom":
			// Updating gameData values based on the input settings if custom difficulty is selected
			customInputs.removeAttribute("hidden");
			gameData.rows = rowInput.value;
			gameData.columns = columnInput.value;
			gameData.bombs = bombInput.value;
			break;
	}

	if (gameData.columns < 8) {
		gameData.columns = 8; // Min Columns
		columnInput.value = 8;
	} else if (gameData.columns > 30) {
		gameData.columns = 30; // Max Columns
		columnInput.value = 30;
	}
	if (gameData.rows < 1) {
		gameData.rows = 1; // Min rows
		rowInput.value = 1;
	} else if (gameData.rows > 30) {
		gameData.rows = 30; // Max rows
		rowInput.value = 30;
	}

	if (gameData.bombs < 0) {
		gameData.bombs = 0; // Number of bombs
		bombInput.value = 0;
	} else if (gameData.bombs >= gameData.rows * gameData.columns) { // Prevents infinite loop when generating bombs
		gameData.bombs = (gameData.rows * gameData.columns) - 1; // Max number of bombs
		bombInput.value = gameData.bombs;
	} 

	gameData.flagsRemaining = gameData.bombs; // How many flags the player has to place (visible)
	gameData.tilesRemaining = ((gameData.columns * gameData.rows) - gameData.bombs); // How many tiles without bombs are left (hidden)
}

function initGame() { // Creates playing grid in HTML
	let gridMatrix = document.querySelector("#gridMatrix"); // Getting the HTML grid-matrix object to use later
	gridMatrix.innerHTML = "";
	gameData.alive = true; // Revives the player so that they can play again after clicking to create a new game
	gameData.initialClick = true;
	gameData.gameGrid = [];
	timeDisplay.innerHTML = "Time: 0";
	flagDisplay.innerHTML = "Flags: " + gameData.flagsRemaining;
	statusDisplay.innerHTML = "Status: Alive";

	for (let y = 0; y < gameData.rows; y++) {
		gameData.gameGrid[y] = [];
		for (let x = 0; x < gameData.columns; x++) { // Creating empty gameGrid matrix by way of nested for loop
			gameData.gameGrid[y][x] = ""; // Empty value for each tile
		}
	}

	// Populates HTML with generated values
	for (let tr = 0; tr < gameData.rows; tr++) {
		let row = gridMatrix.insertRow();
		for (let td = 0; td < gameData.columns; td++) { // Nested for loop going through every tile on the playable grid
			let tile = row.insertCell();
			tile.innerHTML = '<img src="images/coveredtile.png" draggable="false">'; // Adds blank tile for every space on the grid
			tile.id = [tr, td]; // Gives each tile a unique id which is useful for quickly identfying it whenever needed
			tile.addEventListener("mouseup", clickTile, false); // Event listener for the user's mouse click (mouseup)
			tile.addEventListener("mousedown", clickTile, false); // Event listener for the user's mouse click (mouseup)
		}
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

function generateGrid(sourceID) { // Generates a random game grid
	gameData.time = 0;
	intervalID = setInterval(function(){ // Game timer
		gameData.time++;
		timeDisplay.innerHTML = "Time: " + gameData.time;
	}, 1000);

	let surroundingTiles = generateSurroudingTiles(sourceID);
	let possibleTiles = (gameData.columns * gameData.rows) - gameData.bombs - 1; // If you have a 20x30 grid with 598 bombs, there will only be one surrounding tile avaliable, as 600-598-1 = 1
	surroundingTiles = surroundingTiles.slice(0, possibleTiles).map(String); // Slices off excess surrounding tiles in reverse order if there are too many bombs, to prevent infinite loops from not being able to find a spot for the bomb to go

	for (let i = 0; i < gameData.bombs; i++) { // Creates random distribution of bombs
		let bombXcoordinate = Math.floor(Math.random() * gameData.columns); // Random X coordinate for bomb
		let bombYcoordinate = Math.floor(Math.random() * gameData.rows); // Random Y coordinate for bomb
		let gridState = gameData.gameGrid[bombYcoordinate][bombXcoordinate]; // Get the gridstate at the randomly generated coordinates

		if (gridState == "bomb" || sourceID[0] == bombYcoordinate && sourceID[1] == bombXcoordinate) { // Checking whether bomb has already been generated in the same coordinates before 
			i--; // Regenerates bomb position if bomb has been found present in that location previously by repeating for loop
		} else if (surroundingTiles.includes(bombYcoordinate + "," + bombXcoordinate)) {
			i--;
		} else { 
			gameData.gameGrid[bombYcoordinate][bombXcoordinate] = "bomb"; // Sets the value of the cell to a bomb if it passes all the requirements
		}
	}

	for (let y = 0; y < gameData.rows; y++) { // Going through every value in the grid using nested for loops
		for (let x = 0; x < gameData.columns; x++) { 

			// Checking in a 3x3 grid around every point on the grid for how many bombs are around it and assigning it a number from 1-8
			if (isBomb(x, y) != 1) { // If the coordinate is not a bomb, then find its number
				let bombsSurrounding = (
					isBomb(x - 1, y - 1) // Top left 
					+ isBomb(x, y - 1) // Top center
					+ isBomb(x + 1, y - 1) // Top right
					+ isBomb(x - 1, y) // Center left
					+ isBomb(x + 1, y) // Center right
					+ isBomb(x - 1, y + 1) // Bottom left
					+ isBomb(x, y + 1) // Bottom center
					+ isBomb(x + 1, y + 1) // Bottom right
				); 

				gameData.gameGrid[y][x] = bombsSurrounding; // Sets the value of the tile on the gameGrid to the number of bombs around it, which was calculated above
			}
		}
	}

	gameData.initialClick = true; // Sets this value to true every single time a new grid is generated

	if (gameData.debugMode) {
		console.log(gameData.gameGrid);
	}
}

function clickTile(e) { // Responds to player click event and does the corresponding action
	let sourceID = this.id; // Finds ID the tile which was clicked
	let tile = document.getElementById(sourceID); // Finds the tile using the ID found above

	sourceID = sourceID.split(","); // Splits ID into set of coordinates that can be used to locate the corresponding value on the gameGrid

	if (gameData.initialClick && e.which == 1 && e.type == "mouseup") {
		generateGrid(sourceID); // Generates random grid
		gameData.initialClick = false;
	}

	let tileState = tileImage(tile); // Finding what image is present in the tile. Note, this is the grid that the player can see, not the true game grid where the mines are stored
	let gridState = gameData.gameGrid[sourceID[0]][sourceID[1]]; // Find tile position on the gameGrid

	if (e.which == 1 && e.type == "mouseup") {
		if (tileState != "flag" && gridState != "bomb") { // If there is no bomb or flag preventing a click, reveal the state of the tile underneith
			clearTiles(sourceID); // Clears multiple empty tiles at once
			checkWinCondition(); // Checks whether the game has been won

		} else if (tileState != "flag" && gridState == "bomb") { // If the tile is not a flag and the tile is in fact a bomb, lose the game and show all mines
			gameData.alive = false;
			checkWinCondition();
			appendTile(("exploded" + gameData.gameGrid[sourceID[0]][sourceID[1]]), tile); // Appends the tile with the exploded mine image
		} 
	} else if (e.which == 3 && e.type == "mousedown") {
		switch (tileState) {
			case "coveredtile": // Covered tile == tile which the user hasn't done anything with
				appendTile("flag", tile);
				gameData.flagsRemaining--; // Lower the total number of flags left regardless of whether the tile is a bomb
				checkWinCondition();
				break;

			case "flag":
				if (gameData.questionMarks) { // If the question mark option is selected at the start of a game, implement the feature of adding a question mark dynamically
					appendTile("questionmark", tile);
				} else {
					appendTile("coveredtile", tile);
				}

				gameData.flagsRemaining++; // Add to the total number of flags left because the flag is turning into a question mark or empty tile
				break;

			case "questionmark":
				appendTile("coveredtile", tile); // If the tile has a question mark on it and the user right clicks, turn it back to its original state
				break;
		}

		flagDisplay.innerHTML = "Flags: " + gameData.flagsRemaining;

		if (gameData.debugMode) {
			console.log("Tiles Remaining: " + gameData.tilesRemaining);
			console.log(tileState);
		}
	}
	if (gameData.debugMode) { // Debug mode utilities
		console.log(e);
		console.log(sourceID);
	}
}


function isBomb(x, y) { // Returns value of a coordinate on the game grid
	if (inBounds(x, y)) { // Making sure coordinates don't fall outside of the grid
		let gridState = gameData.gameGrid[y][x]; 

		if (gridState == "bomb") {
			return 1; // Returns 1 if there is a bomb in that location
		}
	} 

    return 0; // Returns 0 if there is no bomb in that location, or if the tile is outside the bounds of the game
}

function tileImage(img) { // Grabs picture name from the inlineHTML
	let imageComponents = String(img.innerHTML).split(/["/.]/); // Splits image tag into parts at quote mark ("), slash (/), and dot(.)
	return imageComponents[2]; // Returns third value, which is always the image name based on the way the img tag is structured/created
}

function appendTile(picture, tile) { // Appends tile with the proper image
	tile.innerHTML = '<img src="images/' + picture + '.png" draggable="false">'; // Appends image name in the proper place
}

function inBounds(x, y) { // Checks whether tile is out of bounds
	if (x >= 0 && y >= 0 && x < gameData.columns && y < gameData.rows) {
		return true;
	}
	return false;
}

function winlose(state) { // Flags all unflagged mines if the user wins the game <---> Reveals all mines if the user loses the game
	for (let i = 0; i < gameData.rows; i++) {
		for (let j = 0; j < gameData.columns; j++) { // Going through every tile on the gameGrid to find all the bomb positions
			let gridState = gameData.gameGrid[i][j]; // Current grid state, i.e. mine, number (1-8), empty
			let tile = document.getElementById(i + "," + j);

			switch(state) {
				case "lose":
					if (gridState == "bomb" && tileImage(tile) != "flag" && state == "lose") { // If the tile is a bomb and doesn't have a flag on it, show a regular bomb
						appendTile("bomb", tile);
					} else if (gridState != "bomb" && tileImage(tile) == "flag" && state == "lose") { // If the tile isn't a bomb and is flagged, show a bomb with an x through it
						appendTile("notabomb", tile);
					}
					statusDisplay.innerHTML = "Status: Dead";
					break;

				case "win":
					if (gridState == "bomb" && tileImage(tile) != "flag") { // If the tile is a bomb and doesn't have a flag on it, show a regular bomb
						appendTile("flag", tile);
						gameData.flagsRemaining--;
					}
					flagDisplay.innerHTML = "Flags: " + gameData.flagsRemaining;
					statusDisplay.innerHTML = "Status: You Win!";
					break;
			}
		}
	}
	clearTimer();
	removeEventListeners();
}

function removeEventListeners() { // Removes all event listeners
	for (let i = 0; i < gameData.rows; i++) {
		for (let j = 0; j < gameData.columns; j++) {
			let tile = document.getElementById(i + "," + j);
			tile.removeEventListener("mouseup", clickTile); 
			tile.removeEventListener("mousedown", clickTile); 
		}
	}
}

function clearTiles(sourceID) { // Clears respective tile
	if (sourceID == undefined) { // Fix for undefined sourceID (I don't know where they come from)
		return;
	}

	try {
		let tile = document.getElementById(sourceID[0] + "," + sourceID[1]);
		let gridState = String(gameData.gameGrid[sourceID[0]][sourceID[1]]);

		if (tileImage(tile) == "coveredtile" || tileImage(tile) == "questionmark") {
            appendTile("uncovered" + gridState, tile);
			gameData.tilesRemaining--;
			tile.removeEventListener("mouseup", clickTile); // Removes ability to click on the tile after it has been activated
			tile.removeEventListener("mousedown", clickTile); 

			if (gridState == "0") {
                let surroundingTiles = generateSurroudingTiles(sourceID);

                for (let i = 0; i <= surroundingTiles.length; i++) {
					try {
						clearTiles(surroundingTiles[i]); 
					}
					catch (error) {
						if (gameData.debugMode) {
							console.log("Could not clear a tile at: " + sourceID);
						}
						return;
					} 
                }
            } 
		}
	} catch (error) {
        if (gameData.debugMode) {
			console.log("Error finding a tile using sourceID: " + sourceID);
		}
        return;
    }
}

function checkWinCondition() { // Checks various win conditions against the variables present in the gameData object
	if (gameData.tilesRemaining == 0) {
		console.log("You Win! Your time was: " + gameData.time + " seconds"); 
		winlose("win"); // Player loses
	} else if (gameData.alive == false) {
		console.log("You have died. Your time was: " + gameData.time + " seconds");
		winlose("lose"); // Player wins
	}
}

initGame(); // Creates an initial board on the page upon loading