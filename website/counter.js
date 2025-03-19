// const diceRoller = require("./diceRoller");
import diceRoller from "./diceRoller.js";
console.log(`Helloooooooo TypeScript!`);
const dieSides = document.querySelector("#die-sides-select");
const numOfDice = document.querySelector("#number-of-dice-select");
const rollButton = document.querySelector("#roll-button");
const result = document.querySelector("#dice-results");
rollButton.addEventListener("click", () => {
    if (!Number(dieSides.value) || !Number(numOfDice.value)) {
        alert("Please select a value for both fields.");
        return;
    }
    const { total, indDieRoll } = diceRoller(Number(dieSides.value), Number(numOfDice.value));
    result.textContent = `Total:\n${total}\nIndividual Rolls:\n${indDieRoll.join(" + ")}`;
});
