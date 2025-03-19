interface DiceRollResult {
  total: number;
  indDieRoll: number[];
}

const diceRoller: Function = (dieSides: number, noOfDice: number = 1): DiceRollResult => {
  const indDieRoll = Array(noOfDice).fill(0).map(() => Math.floor(Math.random() * dieSides) + 1);
  const total = indDieRoll.reduce((acc, current) => acc + current, 0);
  return {total, indDieRoll};
}

export default diceRoller;