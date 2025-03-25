const diceRoller = (dieSides, noOfDice = 1) => {
    let indDieRoll = [];
    let total = 0;
    if (dieSides === '100-10s') {
        dieSides = 10;
        indDieRoll = Array(noOfDice).fill(0).map(() => (Math.floor(Math.random() * Number(dieSides)) + 1) * 10);
        total = indDieRoll.reduce((acc, current) => acc + current, 0);
    }
    else {
        dieSides = Number(dieSides);
        indDieRoll = Array(noOfDice).fill(0).map(() => Math.floor(Math.random() * Number(dieSides)) + 1);
        total = indDieRoll.reduce((acc, current) => acc + current, 0);
    }
    return { total, indDieRoll };
};
export default diceRoller;
