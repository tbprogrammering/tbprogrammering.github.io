let currentFormula = {};
let clueIndex = 0;

const inputs = [
    document.getElementById('input-storhet'),
    document.getElementById('input-b-storhet'),
    document.getElementById('input-enhet'),
    document.getElementById('input-b-enhet')
];

const keys = ['storhet', 'bStorhet', 'enhet', 'bEnhet'];

function initGame() {
    currentFormula = formulaData[Math.floor(Math.random() * formulaData.length)];
    clueIndex = Math.floor(Math.random() * 4);
    
    inputs.forEach((input, index) => {
        input.value = "";
        input.disabled = false;
        input.classList.remove('revealed'); // Ta bort gul färg från tidigare runda
        input.style.backgroundColor = "white";
        input.style.borderColor = "#ddd";
        
        if (index === clueIndex) {
            input.value = currentFormula[keys[index]];
            input.disabled = true;
            input.style.backgroundColor = "#e9ecef";
        }
    });

    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('check-btn').classList.remove('hidden');
    document.getElementById('skip-btn').classList.remove('hidden'); // Visa skip
    document.getElementById('next-btn').classList.add('hidden');
}

document.getElementById('skip-btn').addEventListener('click', () => {
    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            input.value = currentFormula[keys[index]];
            input.disabled = true;
            input.classList.add('revealed'); // Markera att svaret visades automatiskt
        }
    });

    const feedback = document.getElementById('feedback');
    feedback.textContent = "Svaren har fyllts i. Försök memorera dem till nästa gång!";
    feedback.className = "feedback wrong"; // Använd röd/gul färg för att markera "ej avklarat själv"
    feedback.classList.remove('hidden');

    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('skip-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
});

document.getElementById('check-btn').addEventListener('click', () => {
    let isCorrect = true;

    // Hjälpfunktion för att göra jämförelsen förlåtande
    function normalize(text) {
        return String(text)
            .trim()
            .toLowerCase()
            .replace(/²/g, '2') // Tolka ² som 2
            .replace(/³/g, '3') // Tolka ³ som 3
            .replace(/\s/g, ''); // Ta bort eventuella mellanslag
    }

    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            const userAns = normalize(input.value);
            const correctAns = normalize(currentFormula[keys[index]]);
            
            // Specialhantering för verkningsgrad (-)
            if (userAns === correctAns || (userAns === "" && correctAns === "-")) {
                input.style.borderColor = "#28a745";
                input.style.backgroundColor = "#f0fff4";
            } else {
                input.style.borderColor = "#dc3545";
                input.style.backgroundColor = "#fff5f5";
                isCorrect = false;
            }
        }
    });

    const feedback = document.getElementById('feedback');
    feedback.classList.remove('hidden');
    if (isCorrect) {
        feedback.textContent = "Snyggt! Allt rätt.";
        feedback.className = "feedback correct";
        document.getElementById('check-btn').classList.add('hidden');
        document.getElementById('skip-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.remove('hidden');
    } else {
        feedback.textContent = "Något blev fel. Kontrollera de rödmarkerade fälten.";
        feedback.className = "feedback wrong";
    }
});

document.getElementById('next-btn').addEventListener('click', initGame);
initGame();
