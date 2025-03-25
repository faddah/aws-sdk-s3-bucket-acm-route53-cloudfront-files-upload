import DiceRollResult from "./diceRollResultIF";

const diceRoller: Function = (dieSides: number | string, noOfDice: number = 1): DiceRollResult => {
  let indDieRoll: number[] = [];
  let total: number = 0;
  if (dieSides === '100-10s') {
    dieSides = 10 as number;
    indDieRoll = Array(noOfDice).fill(0).map(() => (Math.floor(Math.random() * Number(dieSides)) + 1) * 10);
    total = indDieRoll.reduce((acc, current) => acc + current, 0);
  } else {
    dieSides = Number(dieSides as string) as number;
    indDieRoll = Array(noOfDice).fill(0).map(() => Math.floor(Math.random() * Number(dieSides)) + 1);
    total = indDieRoll.reduce((acc, current) => acc + current, 0);
  }
  return {total, indDieRoll};
}

export default diceRoller;