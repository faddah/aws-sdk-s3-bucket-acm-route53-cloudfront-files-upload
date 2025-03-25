// const diceRoller = require("./diceRoller");
import diceRoller from "./diceRoller.js";
console.log(`Helloooooooo TypeScript!`);
const dieSides = document.querySelector("#die-sides-select");
const numOfDice = document.querySelector("#number-of-dice-select");
const rollButton = document.querySelector("#roll-button");
const result = document.querySelector("#dice-results");
dieSides.addEventListener("change", () => {
    const numOfDiceOptions = numOfDice.querySelectorAll("option");
    if (dieSides.value === "100-10s") {
        numOfDiceOptions.forEach((option) => {
            if (option.value === "1") {
                option.disabled = false;
                option.selected = true;
            }
            else {
                option.disabled = true;
            }
        });
    }
    else {
        numOfDiceOptions.forEach((option) => {
            option.disabled = false;
        });
    }
});
rollButton.addEventListener("click", () => {
    if (dieSides.value !== "100-10s" && (!Number(dieSides.value) || !Number(numOfDice.value))) {
        alert("Please select a value for both fields.");
        return;
    }
    const { total, indDieRoll } = diceRoller(dieSides.value, Number(numOfDice.value));
    result.textContent = `Total:\n${total}\nIndividual Rolls:\n${indDieRoll.join(" + ")}`;
});
