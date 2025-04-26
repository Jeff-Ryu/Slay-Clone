let turn = 0;
let clickedHex = 0;
// Ownership - 0= none, 1= green, 2= red
let ownership = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
// Defence Values for each grid
let defence = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
// Player 1 Stats
let p1_units = 0;
let p1_income = 0;
let p1_expense = 0;
let p1_balance = 15;
// Player 2 Stats
let p2_units = 0;
let p2_income = 0;
let p2_expense = 0;
let p2_balance = 15;

// Populate initial display data on load / Add listeners for each hex
window.addEventListener("DOMContentLoaded", function () {
  startSettings();
  updateGrid();
  updateUI("green");
  document.querySelectorAll("polygon.hex").forEach(polygon => {
    polygon.addEventListener("click", handleClick);
  });
});
function startSettings() {
  ownership[9] = 1;
  ownership[15] = 1;
  ownership[16] = 1;
  ownership[22] = 1;

  ownership[14] = 2;
  ownership[20] = 2;
  ownership[21] = 2;
  ownership[27] = 2;
}
// Check ownership of each hex in grid and update color accordingly
function updateGrid() {
  for (let i = 0; i < ownership.length; i++) {
    const currentHex = document.querySelector(`polygon.hex[data-index="${i}"]`);
    if (currentHex === null) continue;
    currentHex.removeAttribute("id");
    if (ownership[i] === 1) {
      currentHex.id = "green";
    } else if (ownership[i] === 2){
      currentHex.id = "red";
    }
  }
}
// Calculates Income and Expenses and updates UI
function updateUI(turn) {
  if (turn === "green") {
    p1_income = calcIncome(1);
    p1_expense = p1_units * 2;
    document.getElementById("turn").textContent = "Turn: Green";
    document.getElementById("income").textContent = p1_income + " c";
    document.getElementById("expense").textContent = p1_expense + " c";
    document.getElementById("balance").textContent = p1_balance + " c";
  } else if (turn === "red") {
    p2_income = calcIncome(2);
    p2_expense = p2_units * 2;
    document.getElementById("turn").textContent = "Turn: Red";
    document.getElementById("income").textContent = p2_income + " c";
    document.getElementById("expense").textContent = p2_expense + " c";
    document.getElementById("balance").textContent = p2_balance + " c";
  }
}
function calcIncome(owner) {
  const income = countOccurrences(ownership, owner);
  return income;
} 
function countOccurrences(array, target) {
  return array.filter(num => num === target).length;
}

// Handle Click //
function handleClick(event) {
  const container = event.currentTarget.closest(".hex-container");
  const existing = container.querySelector(".object");
  const clickedHexIndex = parseInt(event.target.dataset.index);

  // If an Object Already Exists
  if (existing) {
    if (turn === 0 && ownership[clickedHexIndex] === 1) {
      existing.remove();
      p1_units = p1_units - 1;
      p1_balance = p1_balance + 10;
      updateUI("green");
    } else if (turn === 1 && ownership[clickedHexIndex] === 2) {
      existing.remove();
      p2_units = p2_units - 1;
      p2_balance = p2_balance + 10;
      updateUI("red");
    }
    return;
  }
  // Balance Check $
  if (turn === 0 && p1_balance <= 9) return;
  if (turn === 1 && p2_balance <= 9) return;
  
  // Green's Turn
  if (turn === 0) {
    if (ownership[clickedHexIndex] !== 0 && ownership[clickedHexIndex] !== turn + 1) {
      if (defence[clickedHexIndex] >= 1) return; // Block placement
    }
    placeUnit(1, container, event.target);
    p1_balance -= 10; //Spend 10c to place unit
    p1_units ++; // Add unit count by 1 for green
    setOwner(clickedHexIndex, 1)
    updateUI("green");
    return;
  }
  // Red's Turn
  if (turn === 1) {
    if (ownership[clickedHexIndex] !== 0 && ownership[clickedHexIndex] !== turn + 1) {
      if (defence[clickedHexIndex] >= 1) return; // Block placement
    }
    placeUnit(2, container, event.target);
    p2_balance = p2_balance - 10; // Spend 10c to place unit
    p2_units = p2_units + 1; // Add unit count by 1 for red
    setOwner(clickedHexIndex, 2);
    updateUI("red");
    return;
  }
}

// placeUnit() Function
function placeUnit(player, container, target) {
  // Populate Hex with new SVG
  const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  newSvg.setAttribute("viewBox", "0 0 100 100");
  newSvg.classList.add("object")
  // Set color based on player
  const color = player === 1 ? "rgb(0, 255, 0)" : "rgb(255, 0, 0)";
  // Populate Svg with new Circle
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "50");
  circle.setAttribute("cy", "50");
  circle.setAttribute("r", "50");
  circle.setAttribute("fill", color);
  
  newSvg.appendChild(circle);
  container.appendChild(newSvg);
  addPop(target);

  const x = parseInt(target.dataset.x);
  const y = parseInt(target.dataset.y);
  boostDefense(x, y, player);
}

function boostDefense(x, y, player) {
  // Get the 6 neighboring coordinates based on row parity
  const neighbors = getNeighbors(x, y);

  // Loop through all hex tiles on the board
  document.querySelectorAll("polygon.hex").forEach(hex => {
    const hx = parseInt(hex.dataset.x); // hex x-coordinate
    const hy = parseInt(hex.dataset.y); // hex y-coordinate
    const index = parseInt(hex.dataset.index); // hex index in defence[]

    // If this is the clicked hex OR one of its neighbors, increase defense
    const isClicked = hx === x && hy === y;
    const isNeighbor = neighbors.some(([nx, ny]) => hx === nx && hy === ny);

    if (isClicked || isNeighbor) {
      if (ownership[index] === player) {
        defence[index] += 1;
      }
    }
  });
}

function getNeighbors(x, y) {
  const even = y % 2 === 0;
  return even
    ? [[x-1, y], [x+1, y], [x, y-1], [x+1, y-1], [x, y+1], [x+1, y+1]]
    : [[x-1, y], [x+1, y], [x-1, y-1], [x, y-1], [x-1, y+1], [x, y+1]];
}

function addPop(hex) {
  hex.classList.remove("animate-click");
  void hex.offsetWidth;
  hex.classList.add("animate-click");
}

function setOwner(index, newOwner) {
  const currentOwner = ownership[index];
  if (currentOwner !== newOwner) {
    ownership[index] = newOwner;
    updateGrid();
  }
}

// Pass Turn Button
function passTurn() {
  const turn_bg = document.getElementById("info");
  if (turn === 0) {
    p2_balance = (p2_balance + p2_income) - p2_expense;

    turn_bg.classList.add("green-bg");
    void turn_bg.offsetWidth;
    turn_bg.classList.remove("green-bg");

    turn_bg.classList.remove("red-bg");
    void turn_bg.offsetWidth;
    turn_bg.classList.add("red-bg");
    
    updateUI("red");
    turn = 1;

  } else if (turn === 1) {
    p1_balance = (p1_balance + p1_income) - p1_expense;

    turn_bg.classList.add("red-bg");
    void turn_bg.offsetWidth;
    turn_bg.classList.remove("red-bg");

    turn_bg.classList.remove("green-bg");
    void turn_bg.offsetWidth;
    turn_bg.classList.add("green-bg");

    updateUI("green");
    turn = 0;
  }
}

