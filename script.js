let currentFormula = {};
let clueIndex = 0;
let userLevel = parseInt(localStorage.getItem('formulaLevel')) || 1;
let completedInLevel = JSON.parse(localStorage.getItem('completedFormulas')) || [];

const inputs = [
    document.getElementById('input-storhet'),
    document.getElementById('input-b-storhet'),
    document.getElementById('input-enhet'),
    document.getElementById('input-b-enhet')
];
const keys = ['storhet', 'bStorhet', 'enhet', 'bEnhet'];

// SMART NORMALIZE: 
// isSymbol=false (Storhet/Enhet): Förlåtande (låga bokstäver, 2=², 3=³)
// isSymbol=true (Beteckningar): Strikt (Versaler räknas, ² är INTE 2)
function normalize(text, isSymbol = false) {
    if (!text) return "";
    let processed = String(text).trim();

    if (!isSymbol) {
        // För vanliga ord: gör om till små bokstäver och tillåt vanliga siffror för potenser
        return processed.toLowerCase()
            .replace(/²/g, '2').replace(/³/g, '3')
            .replace(/\s/g, '');
    } else {
        // För beteckningar: Behåll versaler och kräv exakta tecken (ingen ersättning av ²/³)
        // Vi behåller bara översättningen av nedsänkta tecken om du vill att tangentbordet 
        // ska fungera för dem, annars ta bort .replace-raden nedan för total strikthet.
        return processed.replace(/\s/g, ''); 
    }
}

function updateSymbolHelpers() {
    const getUniqueSpecialSymbols = (key) => {
        const symbols = formulaData.map(f => f[key]);
        // Hittar tecken som inte är vanliga bokstäver/siffror
        const specialSymbols = symbols.filter(s => /[^a-zA-Z0-9\/\s\-\(\)]/.test(s));
        return [...new Set(specialSymbols)];
    };

    const renderButtons = (containerId, inputId, symbols) => {
        const container = document.getElementById(containerId);
        container.innerHTML = "";
        if (document.getElementById(inputId).disabled) return;

        symbols.forEach(symbol => {
            const btn = document.createElement('button');
            btn.className = 'symbol-btn';
            btn.textContent = symbol;
            btn.type = "button";
            btn.onclick = () => {
                document.getElementById(inputId).value = symbol;
                document.getElementById(inputId).focus();
            };
            container.appendChild(btn);
        });
    };

    renderButtons('symbol-helper-b-storhet', 'input-b-storhet', getUniqueSpecialSymbols('bStorhet'));
    renderButtons('symbol-helper-b-enhet', 'input-b-enhet', getUniqueSpecialSymbols('bEnhet'));
}

function initGame() {
    const levelFormulas = formulaData.filter(f => f.level === userLevel);
    document.getElementById('current-level-display').textContent = userLevel;
    document.getElementById('progress-display').textContent = `${completedInLevel.length}/${levelFormulas.length}`;

    if (completedInLevel.length >= levelFormulas.length) {
        const nextLevelExist = formulaData.some(f => f.level === userLevel + 1);
        if (nextLevelExist) {
            alert(`Snyggt! Nivå ${userLevel} klar. Vidare till Nivå ${userLevel + 1}!`);
            userLevel++;
            completedInLevel = [];
            saveProgress();
            return initGame();
        }
    }

    const remaining = levelFormulas.filter(f => !completedInLevel.includes(f.storhet));
    const pool = remaining.length > 0 ? remaining : levelFormulas;
    currentFormula = pool[Math.floor(Math.random() * pool.length)];

    // Slumpa ledtråd, men undvik dubbletter på enheter
    let selectedClue = Math.floor(Math.random() * 4);
    if ((selectedClue === 2 || selectedClue === 3) && formulaData.filter(f => f.enhet === currentFormula.enhet).length > 1) {
        selectedClue = Math.floor(Math.random() * 2);
    }
    clueIndex = selectedClue;

    inputs.forEach((input, index) => {
        input.value = ""; input.disabled = false;
        input.style.backgroundColor = "white"; input.style.borderColor = "#ddd";
        if (index === clueIndex) {
            input.value = currentFormula[keys[index]];
            input.disabled = true;
            input.style.backgroundColor = "#e9ecef";
        }
    });

    updateSymbolHelpers();
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('check-btn').classList.remove('hidden');
    document.getElementById('skip-btn').classList.remove('hidden');
    document.getElementById('next-btn').classList.add('hidden');
}

document.getElementById('check-btn').addEventListener('click', () => {
    let allFieldsCorrect = true;
    let anyFieldFilled = false;

    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            const userValue = input.value.trim();
            if (userValue !== "") anyFieldFilled = true;

            const isSymbolField = (index === 1 || index === 3);
            const userAns = normalize(userValue, isSymbolField);
            const correctAns = normalize(currentFormula[keys[index]], isSymbolField);
            
            if (userAns === correctAns || (userAns === "" && correctAns === "-")) {
                input.style.borderColor = "#28a745";
                input.style.backgroundColor = "#f0fff4";
            } else {
                input.style.borderColor = "#dc3545";
                input.style.backgroundColor = "#fff5f5";
                allFieldsCorrect = false;
            }
        }
    });

    const feedback = document.getElementById('feedback');
    feedback.classList.remove('hidden');

    if (!anyFieldFilled) {
        feedback.textContent = "Fyll i rutorna först!";
        feedback.className = "feedback wrong";
    } else if (allFieldsCorrect) {
        if (!completedInLevel.includes(currentFormula.storhet)) {
            completedInLevel.push(currentFormula.storhet);
            saveProgress();
        }
        feedback.textContent = "Utmärkt! Allt rätt.";
        feedback.className = "feedback correct";
        document.getElementById('check-btn').classList.add('hidden');
        document.getElementById('skip-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.remove('hidden');
    } else {
        feedback.textContent = "Inte riktigt rätt än. Tänk på stora/små bokstäver och potenser!";
        feedback.className = "feedback wrong";
    }
});

document.getElementById('skip-btn').addEventListener('click', () => {
    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            input.value = currentFormula[keys[index]];
            input.disabled = true;
            input.style.backgroundColor = "#fff3cd";
        }
    });
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('skip-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
});

document.getElementById('next-btn').addEventListener('click', initGame);
document.getElementById('reset-progress').addEventListener('click', () => {
    if(confirm("Nollställa allt?")) { localStorage.clear(); location.reload(); }
});

function saveProgress() {
    localStorage.setItem('formulaLevel', userLevel);
    localStorage.setItem('completedFormulas', JSON.stringify(completedInLevel));
}

initGame();