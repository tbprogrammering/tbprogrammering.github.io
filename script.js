// --- GLOBAL DATA & STATE ---
let currentFormula = {};
let clueIndex = 0;
let userLevel = parseInt(localStorage.getItem('formulaLevel')) || 1;
// nollställer denna varje gång nivån ökar för att tvinga repetition
let completedInLevel = JSON.parse(localStorage.getItem('completedFormulas')) || [];

const inputs = [
    document.getElementById('input-storhet'),   
    document.getElementById('input-b-storhet'), 
    document.getElementById('input-enhet'),     
    document.getElementById('input-b-enhet')    
];
const keys = ['storhet', 'bStorhet', 'enhet', 'bEnhet'];

// --- HJÄLPFUNKTIONER ---

function normalize(text, isSymbol = false) {
    if (!text) return "";
    let processed = String(text).trim();
    if (!isSymbol) {
        return processed.toLowerCase()
            .replace(/²/g, '2').replace(/³/g, '3')
            .replace(/\s/g, '');
    } else {
        return processed.replace(/\s/g, '');
    }
}

function updateSymbolHelpers() {
    const renderButtons = (containerId, inputId, key) => {
        const container = document.getElementById(containerId);
        container.innerHTML = "";
        const symbols = [...new Set(formulaData.map(f => f[key]))];

        symbols.forEach(symbol => {
            if (/[_²³]|[^a-zA-Z0-9\/\s\-\(\)]/.test(symbol)) {
                const btn = document.createElement('button');
                btn.className = 'symbol-btn';
                btn.type = "button";
                
                if (symbol.includes('_')) {
                    const parts = symbol.split('_');
                    btn.innerHTML = `${parts[0]}<sub>${parts[1]}</sub>`;
                } else {
                    btn.textContent = symbol;
                }

                btn.onclick = () => {
                    const targetInput = document.getElementById(inputId);
                    if (targetInput.getAttribute('contenteditable') === 'false') return;

                    if (symbol.includes('_')) {
                        const parts = symbol.split('_');
                        targetInput.innerHTML = `${parts[0]}<sub>${parts[1]}</sub>`;
                    } else {
                        targetInput.innerHTML = symbol;
                    }
                    targetInput.focus();
                };
                container.appendChild(btn);
            }
        });
    };
    renderButtons('symbol-helper-b-storhet', 'input-b-storhet', 'bStorhet');
    renderButtons('symbol-helper-b-enhet', 'input-b-enhet', 'bEnhet');
}

// --- SPELLOGIK ---
function initGame() {
    // Hämta alla formler från Nivå 1 upp till nuvarande nivå
    const availableFormulas = formulaData.filter(f => f.level <= userLevel);
    
    // Hitta de som återstår att lösa i den aktuella "vågen"
    const remaining = availableFormulas.filter(f => !completedInLevel.includes(f.storhet));

    // Uppdatera statusraden
    document.getElementById('current-level-display').innerHTML = `Nivå: <b>${userLevel}</b>`;
    document.getElementById('progress-display').innerHTML = `Framsteg: <b>${completedInLevel.length}/${availableFormulas.length}</b>`;

    // KOLL: Är ALLA formler (inklusive repetitioner) avklarade för denna nivå?
    if (remaining.length === 0) {
        const nextLevelExist = formulaData.some(f => f.level === userLevel + 1);
        if (nextLevelExist) {
            alert(`Snyggt! Du har bemästrat alla storheter. För att klara nivå ${userLevel + 1} måste du nu visa att du kan både de gamla och de nya!`);
            userLevel++;
            completedInLevel = []; // VIKTIGT: Här nollställs framstegen för den nya nivån!
            saveProgress();
            return initGame(); 
        } else {
            document.getElementById('feedback').innerHTML = "WOW! Du har klarat precis allt på alla nivåer!";
            document.getElementById('feedback').className = "feedback correct";
            document.getElementById('feedback').classList.remove('hidden');
        }
    }

    // Slumpa från de som är kvar
    const pool = remaining.length > 0 ? remaining : availableFormulas;
    currentFormula = pool[Math.floor(Math.random() * pool.length)];

    clueIndex = Math.floor(Math.random() * 4);

    inputs.forEach((input, index) => {
        input.innerHTML = ""; 
        if (input.tagName === "INPUT") input.value = ""; 
        input.style.backgroundColor = "white";
        input.style.borderColor = "#ddd";

        if (index === clueIndex) {
            let val = currentFormula[keys[index]];
            if (input.tagName === "INPUT") {
                input.value = val;
                input.disabled = true;
            } else {
                input.setAttribute('contenteditable', 'false');
                if (typeof val === 'string' && val.includes('_')) {
                    const p = val.split('_');
                    input.innerHTML = `${p[0]}<sub>${p[1]}</sub>`;
                } else {
                    input.innerHTML = val;
                }
            }
            input.style.backgroundColor = "#e9ecef";
        } else {
            if (input.tagName === "INPUT") input.disabled = false;
            else input.setAttribute('contenteditable', 'true');
        }
    });

    updateSymbolHelpers();
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('check-btn').classList.remove('hidden');
    document.getElementById('skip-btn').classList.remove('hidden');
    document.getElementById('next-btn').classList.add('hidden');
}

// --- EVENT LISTENERS ---

document.getElementById('check-btn').addEventListener('click', () => {
    let allFieldsCorrect = true;
    let anyFieldFilled = false;

    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            const userRawValue = (input.tagName === "INPUT" ? input.value : input.innerText).trim();
            if (userRawValue !== "") anyFieldFilled = true;

            const isSymbolField = (index === 1 || index === 3);
            const correctValue = currentFormula[keys[index]];

            const userAns = normalize(userRawValue, isSymbolField);
            const correctAns = normalize(correctValue, isSymbolField).replace('_', '');

            if (userAns === correctAns || (userAns === "" && correctValue === "-")) {
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
        feedback.textContent = "Skriv in ditt svar!";
        feedback.className = "feedback wrong";
    } else if (allFieldsCorrect) {
        if (!completedInLevel.includes(currentFormula.storhet)) {
            completedInLevel.push(currentFormula.storhet);
            saveProgress();
        }
        feedback.textContent = "Helt rätt!";
        feedback.className = "feedback correct";
        document.getElementById('check-btn').classList.add('hidden');
        document.getElementById('skip-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.remove('hidden');
    } else {
        feedback.textContent = "Försök igen, titta noga på beteckningarna.";
        feedback.className = "feedback wrong";
    }
});

document.getElementById('skip-btn').addEventListener('click', () => {
    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            let correctVal = currentFormula[keys[index]];
            if (input.tagName === "INPUT") {
                input.value = correctVal;
                input.disabled = true;
            } else {
                input.setAttribute('contenteditable', 'false');
                if (typeof correctVal === 'string' && correctVal.includes('_')) {
                    const p = correctVal.split('_');
                    input.innerHTML = `${p[0]}<sub>${p[1]}</sub>`;
                } else {
                    input.innerHTML = correctVal;
                }
            }
            input.style.backgroundColor = "#fff3cd"; 
        }
    });
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('skip-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
});

document.getElementById('next-btn').addEventListener('click', initGame);

document.getElementById('reset-progress').addEventListener('click', () => {
    if(confirm("Vill du nollställa allt och börja om från Nivå 1?")) {
        localStorage.clear();
        userLevel = 1;
        completedInLevel = [];
        location.reload();
    }
});

function saveProgress() {
    localStorage.setItem('formulaLevel', userLevel);
    localStorage.setItem('completedFormulas', JSON.stringify(completedInLevel));
}

initGame();