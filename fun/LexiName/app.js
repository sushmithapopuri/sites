document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('name-input');
    const btnGenerate = document.getElementById('btn-generate');
    const resultContainer = document.getElementById('result-container');
    const acrosticOutput = document.getElementById('acrostic-output');
    const btnCopy = document.getElementById('btn-copy');

    let adjectivesDict = ADJECTIVES;
    let currentAcrosticState = [];

    // Generate Acrostic on input
    nameInput.addEventListener('input', () => generateAcrostic(false));
    
    // Regenerate all words on button click
    btnGenerate.addEventListener('click', () => generateAcrostic(true));

    function generateAcrostic(forceRegenerate = false) {
        const name = nameInput.value.trim().toUpperCase();

        if (!name) {
            acrosticOutput.innerHTML = '';
            resultContainer.classList.add('hidden');
            currentAcrosticState = [];
            return;
        }

        // Clean name (only alphabetic letters)
        const cleanName = name.replace(/[^A-Z]/g, '');

        if (cleanName.length === 0) {
            acrosticOutput.innerHTML = '';
            resultContainer.classList.add('hidden');
            currentAcrosticState = [];
            return;
        }

        const newAcrosticState = [];
        const usedAdjectives = new Set();
        let htmlOutput = '';

        // Add class to prevent list layout on mobile for short names
        if (cleanName.length < 6) {
            acrosticOutput.classList.add('short-name');
        } else {
            acrosticOutput.classList.remove('short-name');
        }

        for (let i = 0; i < cleanName.length; i++) {
            const letter = cleanName[i];
            let wordToUse = '';

            // Reuse existing word if letter matches, we are not forcing a regenerate,
            // and the word hasn't been used yet in the new sequence
            if (
                !forceRegenerate &&
                currentAcrosticState[i] && 
                currentAcrosticState[i].letter === letter && 
                currentAcrosticState[i].word !== '(No word found)' &&
                !usedAdjectives.has(currentAcrosticState[i].word)
            ) {
                wordToUse = currentAcrosticState[i].word;
            } else {
                // Find a new word
                if (adjectivesDict[letter] && adjectivesDict[letter].length > 0) {
                    const words = adjectivesDict[letter];
                    let availableWords = words.filter(w => !usedAdjectives.has(w));
                    
                    // Fallback to all words if we've exhausted the available ones for this letter
                    if (availableWords.length === 0) {
                        availableWords = words;
                    }
                    
                    wordToUse = availableWords[Math.floor(Math.random() * availableWords.length)];
                } else {
                    wordToUse = '(No word found)';
                }
            }

            newAcrosticState.push({ letter, word: wordToUse });
            if (wordToUse !== '(No word found)') {
                usedAdjectives.add(wordToUse);
            }

            const wordHtml = wordToUse === '(No word found)' 
                ? `<div class="acrostic-word" style="color: var(--text-4);">${wordToUse}</div>`
                : `<div class="acrostic-word">${wordToUse}</div>`;

            htmlOutput += `
                <div class="acrostic-tile">
                    <div class="acrostic-icon">
                        <i class="fa-solid fa-${letter.toLowerCase()}"></i>
                    </div>
                    ${wordHtml}
                </div>
            `;
        }

        currentAcrosticState = newAcrosticState;
        acrosticOutput.innerHTML = htmlOutput;
        resultContainer.classList.remove('hidden');
    }

    // Copy functionality
    btnCopy.addEventListener('click', () => {
        if (currentAcrosticState.length === 0) return;

        let textToCopy = '';
        currentAcrosticState.forEach(item => {
            textToCopy += `${item.letter} - ${item.word}\n`;
        });

        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = btnCopy.textContent;
            btnCopy.textContent = 'Copied!';
            setTimeout(() => {
                btnCopy.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard.');
        });
    });
});
