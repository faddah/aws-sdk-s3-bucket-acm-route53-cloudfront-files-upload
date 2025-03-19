// const diceRoller = require("./diceRoller");
import diceRoller from "./diceRoller.js";

console.log(`Helloooooooo TypeScript!`);

interface DiceRollResult {
    total: number;
    indDieRoll: number[];
}

const dieSides = document.querySelector("#die-sides-select") as HTMLInputElement;
const numOfDice = document.querySelector("#number-of-dice-select") as HTMLInputElement;
const rollButton = document.querySelector("#roll-button") as HTMLButtonElement;
const result = document.querySelector("#dice-results") as HTMLTextAreaElement;

rollButton.addEventListener("click", () => {
    if (!Number(dieSides.value) || !Number(numOfDice.value)) {
        alert("Please select a value for both fields.");
        return;
    }
    const { total, indDieRoll } = diceRoller(Number(dieSides.value), Number(numOfDice.value));
    result.textContent = `Total:\n${total}\nIndividual Rolls:\n${indDieRoll.join(" + ")}`;
});

