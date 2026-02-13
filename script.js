let currentFormula = {};
let clueIndex = 0;

// Hämta sparad nivå eller börja på 1
let userLevel = parseInt(localStorage.getItem('formulaLevel')) || 1;
// Hämta avklarade formler (ID eller namn) från localStorage
let completedInLevel = JSON.parse(localStorage.getItem('completedFormulas')) || [];

const inputs = [
    document.getElementById('input-storhet'),
    document.getElementById('input-b-storhet'),
    document.getElementById('input-enhet'),
    document.getElementById('input-b-enhet')
];
const keys = ['storhet', 'bStorhet', 'enhet', 'bEnhet'];

function normalize(text) {
    if (!text) return "";
    return String(text).trim().toLowerCase()
        .replace(/²/g, '2').replace(/³/g, '3')
        .replace(/[ₖₚₗₛ]/g, m => "kpls"["ₖₚₗₛ".indexOf(m)])
        .replace(/\s/g, ''); 
}

// --- FUNKTION FÖR ATT SKAPA SYMBOL-KNAPPARNA ---
function createSymbolHelper() {
    const helperContainer = document.getElementById('symbol-helper');
    helperContainer.innerHTML = ""; // Rensa först

    // Hämta alla unika beteckningar från hela din data.js
    // Vi filtrerar bort de som är vanliga bokstäver (valfritt) eller bara tar alla grekiska/special
    const allSymbols = [...new Set(formulaData.map(f => f.bStorhet))];

    allSymbols.forEach(symbol => {
        // Vi skapar bara knappar för de som faktiskt innehåller specialtecken 
        // eller är svåra att skriva (t.ex. ρ, η, Ω eller nedsänkta tecken)
        // Om du vill ha ALLA symboler, ta bort if-satsen nedan.
        if (/[^a-zA-Z0-9]/.test(symbol)) { 
            const btn = document.createElement('button');
            btn.className = 'symbol-btn';
            btn.textContent = symbol;
            btn.type = "button"; // Förhindra form-submit
            
            btn.onclick = () => {
                const input = document.getElementById('input-b-storhet');
                if (!input.disabled) {
                    input.value = symbol; // Skriver in symbolen i rutan
                    input.focus();
                }
            };
            helperContainer.appendChild(btn);
        }
    });
}

function initGame() {
    const levelFormulas = formulaData.filter(f => f.level === userLevel);
    
    document.getElementById('current-level-display').textContent = userLevel;
    document.getElementById('progress-display').textContent = `${completedInLevel.length}/${levelFormulas.length}`;

    if (completedInLevel.length >= levelFormulas.length) {
        const nextLevelExist = formulaData.some(f => f.level === userLevel + 1);
        if (nextLevelExist) {
            alert(`Snyggt! Du har klarat Nivå ${userLevel}. Välkommen till Nivå ${userLevel + 1}!`);
            userLevel++;
            completedInLevel = [];
            saveProgress();
            return initGame();
        }
    }

    const remaining = levelFormulas.filter(f => !completedInLevel.includes(f.storhet));
    const pool = remaining.length > 0 ? remaining : levelFormulas;
    currentFormula = pool[Math.floor(Math.random() * pool.length)];

    let possibleClues = [0, 1, 2, 3];
    let selectedClue = possibleClues[Math.floor(Math.random() * possibleClues.length)];

    // Vi kollar om den valda ledtråden är en enhet (index 2 eller 3)
    if (selectedClue === 2 || selectedClue === 3) {
        const enhetValue = currentFormula.enhet;
        const bEnhetValue = currentFormula.bEnhet;

        // Kontrollera om enheten är en "dubblett" eller mycket vanlig (t.ex. Joule)
        // Vi räknar hur många gånger denna enhet förekommer i hela listan
        const enhetOccurrences = formulaData.filter(f => f.enhet === enhetValue).length;
        
        // Om enheten förekommer på mer än 1 rad (t.ex. Joule finns på Energi, Arbete, Värmeenergi)
        // ELLER om beteckningen är väldigt kort (risk för att de är för lika), tvinga fram kolumn 0 eller 1.
        if (enhetOccurrences > 1) {
            selectedClue = Math.floor(Math.random() * 2); 
        }
    }
    clueIndex = selectedClue;
    
    // Rensa och hantera inputfält som vanligt
    inputs.forEach((input, index) => {
        input.value = "";
        input.disabled = false;
        input.style.backgroundColor = "white";
        // ...
    });

    // Uppdatera symbol-hjälparen så den syns/döljs korrekt
    createSymbolHelper(); 
    
    // Om bStorhet (index 1) är ledtråden, dölj knapparna
    const helper = document.getElementById('symbol-helper');
    helper.style.display = (clueIndex === 1) ? "none" : "flex";

    inputs.forEach((input, index) => {
        input.value = "";
        input.disabled = false;
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
    document.getElementById('skip-btn').classList.remove('hidden');
    document.getElementById('next-btn').classList.add('hidden');
}
function saveProgress() {
    localStorage.setItem('formulaLevel', userLevel);
    localStorage.setItem('completedFormulas', JSON.stringify(completedInLevel));
}

document.getElementById('check-btn').addEventListener('click', () => {
    let allFieldsCorrect = true;
    let anyFieldFilled = false; // Håller koll på om användaren skrivit något alls

    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            const userValue = input.value.trim();
            if (userValue !== "") {
                anyFieldFilled = true; // Användaren har skrivit i minst en ruta
            }

            const userAns = normalize(userValue);
            const correctAns = normalize(currentFormula[keys[index]]);
            
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

    // 1. Om inget fält är ifyllt
    if (!anyFieldFilled) {
        feedback.textContent = "Du måste fylla i rutorna innan du kontrollerar!";
        feedback.className = "feedback wrong";
        // Återställ färger till neutrala om de råkat trycka på tomma fält
        inputs.forEach((input, index) => {
            if (index !== clueIndex) {
                input.style.borderColor = "#ddd";
                input.style.backgroundColor = "white";
            }
        });
    } 
    // 2. Om allt är rätt
    else if (allFieldsCorrect) {
        if (!completedInLevel.includes(currentFormula.storhet)) {
            completedInLevel.push(currentFormula.storhet);
            saveProgress();
        }
        feedback.textContent = "Snyggt! Allt rätt på denna rad.";
        feedback.className = "feedback correct";
        document.getElementById('check-btn').classList.add('hidden');
        document.getElementById('skip-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.remove('hidden');
    } 
    // 3. Om man skrivit något, men det är fel eller ofullständigt
    else {
        feedback.textContent = "Vissa fält är korrekta, men inte alla. Kämpa på!";
        feedback.className = "feedback wrong";
    }
});

document.getElementById('skip-btn').addEventListener('click', () => {
    inputs.forEach((input, index) => {
        if (index !== clueIndex) {
            // Fyll i rätt svar från data.js
            input.value = currentFormula[keys[index]];
            input.disabled = true;
            
            // Ge en annan färg så eleven ser att de hoppade över
            input.style.backgroundColor = "#fff3cd"; 
            input.style.borderColor = "#ffeeba";
        }
    });

    const feedback = document.getElementById('feedback');
    feedback.textContent = "Här är de rätta svaren. Försök memorera dem!";
    feedback.className = "feedback wrong"; // Gul/Röd färg
    feedback.classList.remove('hidden');

    // Hantera knappar
    document.getElementById('check-btn').classList.add('hidden');
    document.getElementById('skip-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
});

// Knapp för att nollställa om man vill börja om från början
document.getElementById('reset-progress').addEventListener('click', () => {
    if(confirm("Vill du verkligen nollställa alla dina levlar?")) {
        localStorage.clear();
        location.reload();
    }
});

document.getElementById('next-btn').addEventListener('click', initGame);
initGame();