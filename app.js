let currentQuestionIndex = 0;
let userAnswers = [];
let userVector = new Array(15).fill(0);
let testResults = [];

function showPage(pageId) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function goToIntro() {
    showPage('intro-page');
}

function startTest() {
    currentQuestionIndex = 0;
    userAnswers = new Array(QUESTIONS.length).fill(-1);
    userVector = new Array(15).fill(0);
    showPage('test-page');
    renderQuestion();
}

function renderQuestion() {
    const question = QUESTIONS[currentQuestionIndex];
    const questionNumber = document.getElementById('question-number');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options');
    const progressFill = document.getElementById('progress-fill');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    questionNumber.textContent = `第 ${currentQuestionIndex + 1} 题`;
    questionText.innerHTML = '';

    const totalQuestions = QUESTIONS.length;
    const progress = ((currentQuestionIndex) / totalQuestions) * 100;
    progressFill.style.width = `${progress}%`;

    optionsContainer.innerHTML = '';

    const navigation = document.querySelector('.navigation');
    navigation.style.display = 'none';
    navigation.classList.remove('visible');

    optionsContainer.innerHTML = '';
    questionText.innerHTML = '';

    typeWriter(questionText, question.text, () => {
        question.options.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'option';
            if (userAnswers[currentQuestionIndex] === index) {
                optionEl.classList.add('selected');
            }
            optionEl.innerHTML = '';
            optionEl.onclick = () => selectOption(index);
            optionsContainer.appendChild(optionEl);

            setTimeout(() => {
                typeWriter(optionEl, option.text);
            }, index * 200);
        });

        const animationDelay = question.options.length * 200 + 800;
        setTimeout(() => {
            prevBtn.style.display = currentQuestionIndex > 0 ? 'block' : 'none';

            if (currentQuestionIndex === totalQuestions - 1) {
                nextBtn.textContent = '提交';
            } else {
                nextBtn.textContent = '下一题';
            }

            nextBtn.disabled = userAnswers[currentQuestionIndex] === -1;
            navigation.style.display = 'flex';
            requestAnimationFrame(() => {
                navigation.classList.add('visible');
            });
        }, animationDelay);
    });
}

function typeWriter(element, text, callback) {
    element.innerHTML = '';
    let i = 0;
    const speed = 50;

    function type() {
        if (i < text.length) {
            if (text.substring(i, i + 4) === '<br>') {
                const br = document.createElement('br');
                element.appendChild(br);
                i += 4;
            } else {
                const char = text.charAt(i);
                const span = document.createElement('span');
                span.className = 'char-anim';
                span.style.animationDelay = `${i * 0.02}s`;
                span.textContent = char;
                element.appendChild(span);
                i++;
            }
            setTimeout(type, speed);
        } else if (callback) {
            setTimeout(callback, 300);
        }
    }
    type();
}

function selectOption(optionIndex) {
    const prevAnswer = userAnswers[currentQuestionIndex];
    const question = QUESTIONS[currentQuestionIndex];
    const weight = question.weight || 1;

    if (prevAnswer !== -1) {
        const prevScores = question.options[prevAnswer].scores;
        for (const dimName in prevScores) {
            const vectorIndex = VECTOR_NAMES.indexOf(dimName);
            if (vectorIndex !== -1) {
                userVector[vectorIndex] -= prevScores[dimName] * weight;
            }
        }
    }

    userAnswers[currentQuestionIndex] = optionIndex;

    const scores = question.options[optionIndex].scores;
    for (const dimName in scores) {
        const vectorIndex = VECTOR_NAMES.indexOf(dimName);
        if (vectorIndex !== -1) {
            userVector[vectorIndex] += scores[dimName] * weight;
        }
    }

    document.querySelectorAll('.option').forEach((opt, idx) => {
        opt.classList.toggle('selected', idx === optionIndex);
    });

    document.getElementById('next-btn').disabled = false;
}

function nextQuestion() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (currentQuestionIndex < QUESTIONS.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        calculateResults();
    }
}

function prevQuestion() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function calculateResults() {
    const normalizedUserVector = normalizeVector(userVector);

    const bookScores = BOOKS.map(book => {
        const bookVector = getBookVector(book);
        const normalizedBookVector = normalizeVector(bookVector);
        const similarity = cosineSimilarity(normalizedUserVector, normalizedBookVector);
        return {
            book: book,
            score: similarity
        };
    });

    bookScores.sort((a, b) => b.score - a.score);

    const top3 = bookScores.slice(0, 3);

    const resultData = {
        date: new Date().toLocaleString('zh-CN'),
        books: top3.map(item => item.book.title),
        userVector: [...normalizedUserVector]
    };

    saveToHistory(resultData);

    testResults = top3;
    showTransitionPage();
}

function showTransitionPage() {
    const lastAnswer = userAnswers[userAnswers.length - 1];
    const lastQuestion = QUESTIONS[QUESTIONS.length - 1];

    let transitionText = '';
    switch (lastAnswer) {
        case 0: // 糖
            transitionText = "店主对你笑了笑。\n\n\"生活太苦了，我们来加一点甜。\"";
            break;
        case 1: // 药
            transitionText = "店主对你笑了笑。\n\n\"书籍都是疗愈人心的药，只是切记，是药三分毒。\"";
            break;
        case 2: // 茶
            transitionText = "店主对你笑了笑。\n\n\"在阳光明媚的下午，没有什么比邀一盏清茶与书香作伴更令人心旷神怡。\"";
            break;
        case 3: // 饭
            transitionText = "店主对你笑了笑。\n\n\"吃饱了才有力气干活！\"";
            break;
        case 4: // 酒
            transitionText = "店主对你笑了笑。\n\n\"我也曾是深夜小酒馆里听故事的人。\"";
            break;
        default:
            transitionText = "店主对你笑了笑。\n\n\"让我为你配一剂适合此刻的药方。\"";
    }

    const transitionEl = document.getElementById('transition-text');
    const btn = document.getElementById('transition-btn');

    transitionEl.innerHTML = '';
    btn.style.display = 'none';

    const textWithBreaks = transitionText.replace(/\n/g, '<br><br>');
    typeWriter(transitionEl, textWithBreaks, () => {
        setTimeout(() => {
            btn.style.display = 'inline-block';
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(10px)';

            setTimeout(() => {
                btn.style.transition = 'all 0.5s ease';
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            }, 50);
        }, 1000);
    });

    showPage('transition-page');
}

function showResults() {
    displayResults(testResults);
}

function displayResults(results) {
    const resultBooksContainer = document.getElementById('result-books');
    resultBooksContainer.innerHTML = '';

    const topBook = results[0];
    const book = topBook.book;

    const topBookCard = document.createElement('div');
    topBookCard.className = 'book-card top-book';
    topBookCard.innerHTML = `
        <span class="book-rank">第一味</span>
        <h3 class="book-title">《${book.title}》</h3>
        <p class="book-author">${book.author}</p>
        <p class="book-desc">${book.desc}</p>
        <div class="book-recommendation">${generateRecommendation(book)}</div>
    `;
    resultBooksContainer.appendChild(topBookCard);

    if (results.length > 1) {
        const subtitle = document.createElement('p');
        subtitle.className = 'result-subtitle';
        subtitle.textContent = '或许它们也适合你：';
        resultBooksContainer.appendChild(subtitle);

        const othersContainer = document.createElement('div');
        othersContainer.className = 'other-books';

        const chineseNumbers = ['一', '二', '三'];
        for (let i = 1; i < results.length; i++) {
            const item = results[i];
            const otherBook = item.book;

            const otherCard = document.createElement('div');
            otherCard.className = 'book-card small-book';
            otherCard.innerHTML = `
                <span class="book-rank-small">第${chineseNumbers[i]}味</span>
                <h4 class="book-title-small">《${otherBook.title}》</h4>
                <p class="book-author-small">${otherBook.author}</p>
                <p class="book-desc-small">${otherBook.desc}</p>
            `;
            othersContainer.appendChild(otherCard);
        }
        resultBooksContainer.appendChild(othersContainer);
    }

    showPage('result-page');
}

function generateRecommendation(book) {
    const templates = [
        `你的心绪与这本《${book.title}》之间，有一种近乎本能的呼应。`,
        `像是为你写下的文字，每一行都可能与你此刻的呼吸合拍。`,
        `也许此刻翻开它，你会发现，正在寻找的答案早已在那里等你。`,
        `无需多言，你们之间只隔着一页纸的距离。`,
        `在你需要它的时刻，它正静静地等着你。`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

function saveToHistory(resultData) {
    let history = JSON.parse(localStorage.getItem('bookweb_history') || '[]');
    history.unshift(resultData);
    if (history.length > 10) {
        history = history.slice(0, 10);
    }
    localStorage.setItem('bookweb_history', JSON.stringify(history));
}

function retest() {
    startTest();
}

function shareResult() {
    const history = JSON.parse(localStorage.getItem('bookweb_history') || '[]');
    if (history.length === 0) return;

    const latestResult = history[0];

    const shareBooksEl = document.getElementById('share-books');
    shareBooksEl.innerHTML = `<p>今日药方：</p>`;
    latestResult.books.forEach((title, i) => {
        shareBooksEl.innerHTML += `<p><strong>${i + 1}. ${title}</strong></p>`;
    });

    document.getElementById('share-modal').classList.add('active');
}

function closeShareModal() {
    document.getElementById('share-modal').classList.remove('active');
}

function downloadShareCard() {
    const shareCard = document.getElementById('share-card');

    html2canvas(shareCard).then(canvas => {
        const link = document.createElement('a');
        link.download = '心灵药铺推荐.png';
        link.href = canvas.toDataURL();
        link.click();
    }).catch(err => {
        alert('店主迷路了，请稍后重试');
    });
}

function viewHistory() {
    const history = JSON.parse(localStorage.getItem('bookweb_history') || '[]');
    const historyList = document.getElementById('history-list');

    if (history.length === 0) {
        historyList.innerHTML = '<p style="text-align:center;color:#718096;">暂无历史记录</p>';
    } else {
        historyList.innerHTML = '';
        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <p class="history-date">${item.date}</p>
                <p class="history-books">${item.books.join(' / ')}</p>
            `;
            historyList.appendChild(historyItem);
        });
    }

    showPage('history-page');
}

function closeHistory() {
    showPage('result-page');
}

function showOwnerMessage() {
    document.getElementById('owner-modal').classList.add('active');
}

function closeOwnerModal() {
    document.getElementById('owner-modal').classList.remove('active');
}