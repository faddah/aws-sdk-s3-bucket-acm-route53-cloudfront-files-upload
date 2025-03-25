// const diceRoller = require("./diceRoller");
import diceRoller from "./diceRoller.js";
import DiceRollResult from "./diceRollResultIF";

console.log(`Helloooooooo TypeScript!`);

const dieSides = document.querySelector("#die-sides-select") as HTMLInputElement;
const numOfDice = document.querySelector("#number-of-dice-select") as HTMLInputElement;
const rollButton = document.querySelector("#roll-button") as HTMLButtonElement;
const result = document.querySelector("#dice-results") as HTMLTextAreaElement;

dieSides.addEventListener("change", () => {
    const numOfDiceOptions = numOfDice.querySelectorAll("option");
    if (dieSides.value === "100-10s") {
        numOfDiceOptions.forEach((option: HTMLOptionElement) => {
            if (option.value === "1") {
                option.disabled = false;
                option.selected = true;
            } else {
                option.disabled = true;
            }
        });
    } else {
        numOfDiceOptions.forEach((option: HTMLOptionElement) => {
            option.disabled = false;
        });
    }
});

rollButton.addEventListener("click", () => {
    if (dieSides.value !== "100-10s" && (!Number(dieSides.value) || !Number(numOfDice.value))) {
        alert("Please select a value for both fields.");
        return;
    }
    const { total, indDieRoll }: DiceRollResult = diceRoller(dieSides.value, Number(numOfDice.value));
    result.textContent = `Total:\n${total}\nIndividual Rolls:\n${indDieRoll.join(" + ")}`;
});

