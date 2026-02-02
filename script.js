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

// NY LOGIK FÖR ATT HOPPA ÖVER
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
    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            const userAns = input.value.trim().toLowerCase();
            const correctAns = String(currentFormula[keys[index]]).toLowerCase();
            
            if (userAns === correctAns) {
                input.style.borderColor = "#28a745";
            } else {
                input.style.borderColor = "#dc3545";
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
        document.getElementById('next-btn').classList.remove('hidden');
    } else {
        feedback.textContent = "Försök igen!";
        feedback.className = "feedback wrong";
    }
});

document.getElementById('next-btn').addEventListener('click', initGame);
initGame();