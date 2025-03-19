const diceRoller = (dieSides, noOfDice = 1) => {
    const indDieRoll = Array(noOfDice).fill(0).map(() => Math.floor(Math.random() * dieSides) + 1);
    const total = indDieRoll.reduce((acc, current) => acc + current, 0);
    return { total, indDieRoll };
};
export default diceRoller;
