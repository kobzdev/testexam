/**
 * Core Quiz Application Controller & Interactive Logic
 * Features:
 * - True Fisher-Yates randomization for questions and choices (with accurate answer tracking)
 * - Exam Mode & Study Mode
 * - Timer, Progress Bar, Matrix Palette
 * - Image Lightbox & Zoom
 * - Results Analytics & Retake / Smart Retest for missed questions
 * - Audio Synthesizer & Confetti Celebration
 */

class QuizApp {
  constructor() {
    this.rawLoadedQuiz = null; // Unmodified original quiz data
    this.currentQuiz = null;    // Active prepared quiz (possibly randomized)
    
    this.activeQuizState = {
      currentIndex: 0,
      userAnswers: {},          // index -> chosen option index
      flagged: new Set(),
      mode: 'exam',             // 'exam' | 'practice'
      timerSeconds: 0,
      timerInterval: null,
      startTime: null,
      endTime: null,
      isSubmitted: false
    };

    this.settings = {
      soundEnabled: true,
      shuffleQuestions: true,   // Default randomize enabled
      shuffleChoices: true,     // Default choices randomize enabled
      theme: localStorage.getItem('quiz_theme') || 'dark'
    };

    this.audioCtx = null;
    this.init();
  }

  init() {
    this.applyTheme(this.settings.theme);
    this.bindEvents();
    this.renderSampleQuizzes();
    this.setupDropzone();
  }

  /* ================= Audio Synthesizer (Web Audio API) ================= */
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playSound(type) {
    if (!this.settings.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'correct') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.25);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'finish') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const o = this.audioCtx.createOscillator();
          const g = this.audioCtx.createGain();
          o.connect(g);
          g.connect(this.audioCtx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + i * 0.08);
          g.gain.setValueAtTime(0.08, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          o.start(now + i * 0.08);
          o.stop(now + 0.8);
        });
      }
    } catch (e) {
      console.warn("Audio not supported or suspended:", e);
    }
  }

  /* ================= Theme Switcher ================= */
  applyTheme(theme) {
    this.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quiz_theme', theme);

    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  toggleTheme() {
    this.applyTheme(this.settings.theme === 'dark' ? 'light' : 'dark');
  }

  /* ================= View Navigation ================= */
  showView(viewId) {
    document.querySelectorAll('.view-section').forEach(view => {
      view.classList.remove('active');
    });
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ================= Event Handlers ================= */
  bindEvents() {
    // Theme toggle
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => this.toggleTheme());

    // Sound toggle
    document.getElementById('btn-sound-toggle')?.addEventListener('click', (e) => {
      this.settings.soundEnabled = !this.settings.soundEnabled;
      e.currentTarget.textContent = this.settings.soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
      this.showToast(this.settings.soundEnabled ? 'Sound Enabled' : 'Sound Muted');
    });

    // Randomize toggles in UI
    const shuffleQCheckbox = document.getElementById('chk-shuffle-questions');
    const shuffleCCheckbox = document.getElementById('chk-shuffle-choices');
    if (shuffleQCheckbox) {
      shuffleQCheckbox.checked = this.settings.shuffleQuestions;
      shuffleQCheckbox.addEventListener('change', (e) => {
        this.settings.shuffleQuestions = e.target.checked;
      });
    }
    if (shuffleCCheckbox) {
      shuffleCCheckbox.checked = this.settings.shuffleChoices;
      shuffleCCheckbox.addEventListener('change', (e) => {
        this.settings.shuffleChoices = e.target.checked;
      });
    }

    // Home / Brand click
    document.getElementById('brand-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentQuiz && !this.activeQuizState.isSubmitted && Object.keys(this.activeQuizState.userAnswers).length > 0) {
        if (!confirm("Return to Home? Current quiz progress will be reset.")) {
          return;
        }
      }
      this.showView('view-home');
    });

    // Quiz Navigation Buttons
    document.getElementById('btn-prev-question')?.addEventListener('click', () => this.prevQuestion());
    document.getElementById('btn-next-question')?.addEventListener('click', () => this.nextQuestion());
    document.getElementById('btn-flag-question')?.addEventListener('click', () => this.toggleFlagCurrent());
    document.getElementById('btn-submit-quiz')?.addEventListener('click', () => this.promptSubmitQuiz());

    // Results Actions
    document.getElementById('btn-retake-quiz')?.addEventListener('click', () => this.retakeQuiz(false));
    document.getElementById('btn-practice-mistakes')?.addEventListener('click', () => this.retakeQuiz(true));
    document.getElementById('btn-print-results')?.addEventListener('click', () => window.print());
    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      if (this.rawLoadedQuiz) QuizParser.exportQuizToJSON(this.rawLoadedQuiz);
    });

    // Quick Paste Parser Button
    document.getElementById('btn-parse-text')?.addEventListener('click', () => this.handleTextPasteImport());

    // File Input change
    document.getElementById('doc-file-input')?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleFileUpload(e.target.files[0]);
      }
    });

    // Lightbox modal close
    const lightboxDialog = document.getElementById('lightbox-dialog');
    document.getElementById('lightbox-close')?.addEventListener('click', () => lightboxDialog?.close());
    lightboxDialog?.addEventListener('click', (e) => {
      if (e.target === lightboxDialog) lightboxDialog.close();
    });

    // Filter reviews
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const filter = e.currentTarget.getAttribute('data-filter');
        this.renderReviewList(filter);
      });
    });

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      const activeView = document.querySelector('.view-section.active');
      if (!activeView || activeView.id !== 'view-quiz') return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const key = e.key.toUpperCase();
      if (['A', '1'].includes(key)) this.selectChoice(0);
      else if (['B', '2'].includes(key)) this.selectChoice(1);
      else if (['C', '3'].includes(key)) this.selectChoice(2);
      else if (['D', '4'].includes(key)) this.selectChoice(3);
      else if (['E', '5'].includes(key)) this.selectChoice(4);
      else if (e.key === 'ArrowRight' || e.key === 'Enter') this.nextQuestion();
      else if (e.key === 'ArrowLeft') this.prevQuestion();
      else if (key === 'F') this.toggleFlagCurrent();
    });
  }

  /* ================= Drag & Drop File Upload ================= */
  setupDropzone() {
    const dropzone = document.getElementById('dropzone-area');
    const fileInput = document.getElementById('doc-file-input');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    });
  }

  async handleFileUpload(file) {
    try {
      this.showToast(`Loading & extracting "${file.name}"...`);
      const quiz = await QuizParser.parseFile(file);
      this.loadQuizAndConfigure(quiz);
    } catch (err) {
      console.error(err);
      alert(`Error parsing file: ${err.message}\n\nPlease verify that your document contains questions and answer choices.`);
    }
  }

  handleTextPasteImport() {
    const textarea = document.getElementById('paste-text-input');
    const text = textarea?.value?.trim();
    if (!text) {
      alert("Please paste your questions and answers into the text box first.");
      return;
    }

    try {
      const quiz = QuizParser.parseRawText(text, "Pasted Quiz Document");
      this.loadQuizAndConfigure(quiz);
    } catch (err) {
      alert(`Could not parse text: ${err.message}`);
    }
  }

  /* ================= Sample Quizzes ================= */
  renderSampleQuizzes() {
    const container = document.getElementById('sample-quizzes-list');
    if (!container || !window.DEFAULT_SAMPLE_QUIZZES) return;

    container.innerHTML = window.DEFAULT_SAMPLE_QUIZZES.map(quiz => `
      <div class="quiz-preset-card" onclick="app.loadQuizById('${quiz.id}')">
        <div class="preset-card-top">
          <span class="preset-badge">${quiz.category || 'General'}</span>
          <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">⏱️ ${quiz.timeLimitMinutes || 15} mins</span>
        </div>
        <div class="preset-title">${quiz.title}</div>
        <div class="preset-desc">${quiz.description}</div>
        <div class="preset-footer">
          <span>📚 ${quiz.questions.length} Questions (Includes Pictures)</span>
          <span style="color: var(--primary); font-weight: 700;">Start Quiz →</span>
        </div>
      </div>
    `).join('');
  }

  loadQuizById(quizId) {
    const found = window.DEFAULT_SAMPLE_QUIZZES.find(q => q.id === quizId);
    if (found) {
      this.loadQuizAndConfigure(JSON.parse(JSON.stringify(found)));
    }
  }

  /* ================= Fisher-Yates Randomization Engine ================= */
  prepareQuizForSession(sourceQuiz) {
    // Clone raw quiz deeply
    const quizCopy = JSON.parse(JSON.stringify(sourceQuiz));
    let questions = quizCopy.questions;

    // 1. Shuffle Questions if enabled
    if (this.settings.shuffleQuestions) {
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }

    // 2. Shuffle Choices if enabled, keeping track of the correct answer string!
    if (this.settings.shuffleChoices) {
      questions = questions.map(q => {
        const originalCorrectText = q.options[q.correctAnswer];
        const shuffledOptions = [...q.options];

        for (let i = shuffledOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }

        // Find new index of the correct answer
        const newCorrectIndex = shuffledOptions.indexOf(originalCorrectText);

        return {
          ...q,
          options: shuffledOptions,
          correctAnswer: newCorrectIndex >= 0 ? newCorrectIndex : 0
        };
      });
    }

    quizCopy.questions = questions;
    return quizCopy;
  }

  /* ================= Start Quiz Session ================= */
  loadQuizAndConfigure(quiz) {
    this.rawLoadedQuiz = JSON.parse(JSON.stringify(quiz));
    this.currentQuiz = this.prepareQuizForSession(this.rawLoadedQuiz);

    // Update View Title
    document.getElementById('quiz-view-title').textContent = this.currentQuiz.title || 'Interactive Quiz';
    
    // Check mode
    const modeSelect = document.getElementById('quiz-mode-select');
    const selectedMode = modeSelect ? modeSelect.value : 'exam';

    this.startQuiz(selectedMode);
  }

  startQuiz(mode = 'exam') {
    if (!this.currentQuiz || !this.currentQuiz.questions.length) {
      alert("No questions found in this quiz.");
      return;
    }

    // Reset State
    this.activeQuizState = {
      currentIndex: 0,
      userAnswers: {},
      flagged: new Set(),
      mode: mode,
      timerSeconds: (this.currentQuiz.timeLimitMinutes || 20) * 60,
      timerInterval: null,
      startTime: new Date(),
      endTime: null,
      isSubmitted: false
    };

    this.startTimer();
    this.renderQuestionPalette();
    this.renderCurrentQuestion();
    this.showView('view-quiz');
    this.showToast(`Quiz Active: ${this.currentQuiz.questions.length} Questions (Randomized)`);
  }

  /* ================= Timer ================= */
  startTimer() {
    clearInterval(this.activeQuizState.timerInterval);
    const timerElem = document.getElementById('quiz-timer-display');

    this.activeQuizState.timerInterval = setInterval(() => {
      this.activeQuizState.timerSeconds--;
      
      const mins = Math.floor(Math.max(0, this.activeQuizState.timerSeconds) / 60);
      const secs = Math.max(0, this.activeQuizState.timerSeconds) % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      if (timerElem) {
        timerElem.textContent = formatted;
        if (this.activeQuizState.timerSeconds <= 60) {
          timerElem.classList.add('warning');
        } else {
          timerElem.classList.remove('warning');
        }
      }

      if (this.activeQuizState.timerSeconds <= 0) {
        clearInterval(this.activeQuizState.timerInterval);
        alert("Time is up! Your quiz will now be submitted automatically.");
        this.submitQuiz();
      }
    }, 1000);
  }

  /* ================= Question Renderer ================= */
  renderCurrentQuestion() {
    const qIndex = this.activeQuizState.currentIndex;
    const qData = this.currentQuiz.questions[qIndex];
    const total = this.currentQuiz.questions.length;

    // Progress Bar
    const progressFill = document.getElementById('quiz-progress-fill');
    const progressLabel = document.getElementById('progress-counter-text');
    const progressPct = document.getElementById('progress-percentage-text');
    const pct = Math.round(((qIndex + 1) / total) * 100);

    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressLabel) progressLabel.textContent = `Question ${qIndex + 1} of ${total}`;
    if (progressPct) progressPct.textContent = `${pct}% Complete`;

    // Question Number & Text
    document.getElementById('question-number-badge').textContent = `Question ${qIndex + 1}`;
    document.getElementById('question-text-content').textContent = qData.question;

    // Flag Status
    const flagBtn = document.getElementById('btn-flag-question');
    if (flagBtn) {
      if (this.activeQuizState.flagged.has(qIndex)) {
        flagBtn.classList.add('active');
        flagBtn.innerHTML = '🚩 Flagged';
      } else {
        flagBtn.classList.remove('active');
        flagBtn.innerHTML = '🏳️ Flag for Review';
      }
    }

    // Image Container
    const imgContainer = document.getElementById('question-image-container');
    const imgElem = document.getElementById('question-image-element');
    const imgCaption = document.getElementById('question-image-caption');

    if (qData.image) {
      imgElem.src = qData.image;
      imgCaption.textContent = qData.imageCaption || `Figure for Question ${qIndex + 1} (Click to expand)`;
      imgContainer.style.display = 'flex';
      imgElem.onclick = () => this.openLightbox(qData.image, qData.imageCaption || qData.question);
    } else {
      imgContainer.style.display = 'none';
      imgElem.src = '';
    }

    // Render Choice Buttons
    const choicesContainer = document.getElementById('choices-container');
    const selectedAnswer = this.activeQuizState.userAnswers[qIndex];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    choicesContainer.innerHTML = qData.options.map((optText, optIdx) => {
      const isSelected = selectedAnswer === optIdx;
      let extraClass = isSelected ? 'selected' : '';

      // In Practice mode, show instant feedback after choice selection
      if (this.activeQuizState.mode === 'practice' && selectedAnswer !== undefined) {
        if (optIdx === qData.correctAnswer) {
          extraClass += ' instant-correct';
        } else if (isSelected && optIdx !== qData.correctAnswer) {
          extraClass += ' instant-wrong';
        }
      }

      return `
        <button class="choice-option-btn ${extraClass}" onclick="app.selectChoice(${optIdx})">
          <div class="choice-letter">${letters[optIdx] || (optIdx + 1)}</div>
          <div class="choice-text">${optText}</div>
        </button>
      `;
    }).join('');

    // Practice Mode Explanation
    const expBox = document.getElementById('instant-explanation-box');
    if (this.activeQuizState.mode === 'practice' && selectedAnswer !== undefined) {
      expBox.classList.add('active');
      const isRight = selectedAnswer === qData.correctAnswer;
      document.getElementById('instant-exp-status').innerHTML = isRight ? '✅ <strong>Correct!</strong>' : '❌ <strong>Incorrect</strong>';
      document.getElementById('instant-exp-text').textContent = qData.explanation || `The correct answer is Option ${letters[qData.correctAnswer]}.`;
    } else {
      expBox.classList.remove('active');
    }

    // In-Card Navigation Buttons
    const cardPrevBtns = document.querySelectorAll('.btn-in-card-prev');
    const cardNextBtn = document.getElementById('btn-next-question-card');
    const cardSubmitBtn = document.getElementById('btn-submit-quiz-card');

    const isFirst = (qIndex === 0);
    const isLast = (qIndex === total - 1);

    cardPrevBtns.forEach(btn => btn.disabled = isFirst);

    if (isLast) {
      if (cardNextBtn) cardNextBtn.style.display = 'none';
      if (cardSubmitBtn) cardSubmitBtn.style.display = 'inline-flex';
    } else {
      if (cardNextBtn) cardNextBtn.style.display = 'inline-flex';
      if (cardSubmitBtn) cardSubmitBtn.style.display = 'none';
    }

    // Highlight pulse on Next button when answered
    if (selectedAnswer !== undefined && cardNextBtn) {
      cardNextBtn.classList.add('highlight-pulse');
    } else if (cardNextBtn) {
      cardNextBtn.classList.remove('highlight-pulse');
    }

    this.updatePaletteActiveState();
  }

  /* ================= Select Choice ================= */
  selectChoice(optIndex) {
    if (this.activeQuizState.isSubmitted) return;

    const qIndex = this.activeQuizState.currentIndex;
    const qData = this.currentQuiz.questions[qIndex];

    if (optIndex >= qData.options.length) return;

    this.activeQuizState.userAnswers[qIndex] = optIndex;

    if (this.activeQuizState.mode === 'practice') {
      if (optIndex === qData.correctAnswer) {
        this.playSound('correct');
      } else {
        this.playSound('wrong');
      }
    } else {
      this.playSound('select');
    }

    this.renderCurrentQuestion();
    this.renderQuestionPalette();

    // Smoothly ensure in-card next button is visible
    const cardNext = document.getElementById('btn-next-question-card');
    if (cardNext) {
      cardNext.classList.add('highlight-pulse');
    }
  }

  /* ================= Navigation & Palette ================= */
  nextQuestion() {
    if (this.activeQuizState.currentIndex < this.currentQuiz.questions.length - 1) {
      this.activeQuizState.currentIndex++;
      this.renderCurrentQuestion();
    }
  }

  prevQuestion() {
    if (this.activeQuizState.currentIndex > 0) {
      this.activeQuizState.currentIndex--;
      this.renderCurrentQuestion();
    }
  }

  jumpToQuestion(index) {
    if (index >= 0 && index < this.currentQuiz.questions.length) {
      this.activeQuizState.currentIndex = index;
      this.renderCurrentQuestion();
    }
  }

  toggleFlagCurrent() {
    const qIndex = this.activeQuizState.currentIndex;
    if (this.activeQuizState.flagged.has(qIndex)) {
      this.activeQuizState.flagged.delete(qIndex);
      this.showToast("Question unflagged");
    } else {
      this.activeQuizState.flagged.add(qIndex);
      this.showToast("Question flagged for review 🚩");
    }
    this.renderCurrentQuestion();
    this.renderQuestionPalette();
  }

  renderQuestionPalette() {
    const palette = document.getElementById('nav-palette-container');
    if (!palette || !this.currentQuiz) return;

    palette.innerHTML = this.currentQuiz.questions.map((q, idx) => {
      const isAnswered = this.activeQuizState.userAnswers[idx] !== undefined;
      const isFlagged = this.activeQuizState.flagged.has(idx);
      const isActive = this.activeQuizState.currentIndex === idx;

      let classes = 'palette-dot';
      if (isActive) classes += ' active';
      if (isAnswered) classes += ' answered';
      if (isFlagged) classes += ' flagged';

      return `<div class="${classes}" onclick="app.jumpToQuestion(${idx})">${idx + 1}</div>`;
    }).join('');
  }

  updatePaletteActiveState() {
    const dots = document.querySelectorAll('.palette-dot');
    dots.forEach((dot, idx) => {
      if (idx === this.activeQuizState.currentIndex) {
        dot.classList.add('active');
        // Smoothly bring the active dot into view inside the palette container
        dot.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        dot.classList.remove('active');
      }
    });
  }

  /* ================= Image Lightbox ================= */
  openLightbox(src, caption) {
    const dialog = document.getElementById('lightbox-dialog');
    const img = document.getElementById('lightbox-image');
    const cap = document.getElementById('lightbox-caption');
    if (dialog && img) {
      img.src = src;
      if (cap) cap.textContent = caption || '';
      dialog.showModal();
    }
  }

  /* ================= Submit & Results Computation ================= */
  promptSubmitQuiz() {
    const total = this.currentQuiz.questions.length;
    const answeredCount = Object.keys(this.activeQuizState.userAnswers).length;
    const unAnswered = total - answeredCount;

    let msg = "Submit your quiz and view your full score and answers breakdown?";
    if (unAnswered > 0) {
      msg = `You have ${unAnswered} unanswered question(s). Are you sure you want to finish now?`;
    }

    if (confirm(msg)) {
      this.submitQuiz();
    }
  }

  submitQuiz() {
    clearInterval(this.activeQuizState.timerInterval);
    this.activeQuizState.isSubmitted = true;
    this.activeQuizState.endTime = new Date();

    const questions = this.currentQuiz.questions;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    questions.forEach((q, idx) => {
      const userAns = this.activeQuizState.userAnswers[idx];
      if (userAns === undefined) {
        skippedCount++;
      } else if (userAns === q.correctAnswer) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const total = questions.length;
    const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const timeSpentSeconds = Math.round((this.activeQuizState.endTime - this.activeQuizState.startTime) / 1000);
    const mins = Math.floor(timeSpentSeconds / 60);
    const secs = timeSpentSeconds % 60;

    this.playSound('finish');
    if (scorePct >= 70) {
      this.triggerConfetti();
    }

    // Stats
    document.getElementById('res-score-percentage').textContent = `${scorePct}%`;
    document.getElementById('res-correct-count').textContent = correctCount;
    document.getElementById('res-wrong-count').textContent = wrongCount;
    document.getElementById('res-skipped-count').textContent = skippedCount;
    document.getElementById('res-time-spent').textContent = `${mins}m ${secs}s`;
    document.getElementById('res-accuracy-rate').textContent = `${scorePct}%`;

    // Grade
    let grade = 'A+';
    let gradeColor = '#10b981';
    let gradeBg = 'rgba(16, 185, 129, 0.15)';
    let motivational = "Outstanding mastery! You nailed almost every single question!";

    if (scorePct >= 90) {
      grade = 'A+';
      gradeColor = '#10b981';
      motivational = "Superb Performance! Flawless understanding of the material.";
    } else if (scorePct >= 80) {
      grade = 'A';
      gradeColor = '#3b82f6';
      motivational = "Great job! You have a solid grasp on these concepts.";
    } else if (scorePct >= 70) {
      grade = 'B';
      gradeColor = '#8b5cf6';
      motivational = "Good effort! A little more practice and you'll hit mastery.";
    } else if (scorePct >= 50) {
      grade = 'C';
      gradeColor = '#f59e0b';
      motivational = "Passing score, but there is room for improvement. Review your mistakes below.";
    } else {
      grade = 'Needs Review';
      gradeColor = '#f43f5e';
      motivational = "Don't give up! Use the 'Practice Mistakes Only' button to master the questions you missed.";
    }

    const gradeBadge = document.getElementById('res-grade-badge');
    if (gradeBadge) {
      gradeBadge.textContent = grade;
      gradeBadge.style.color = gradeColor;
      gradeBadge.style.background = gradeBg;
    }
    document.getElementById('res-motivational-text').textContent = motivational;

    // SVG Score Circle
    const circle = document.getElementById('score-circle-svg');
    if (circle) {
      const radius = 70;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (scorePct / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }

    this.renderReviewList('all');
    this.showView('view-results');
  }

  /* ================= Review Breakdown ================= */
  renderReviewList(filter = 'all') {
    const listContainer = document.getElementById('review-cards-list');
    if (!listContainer || !this.currentQuiz) return;

    const questions = this.currentQuiz.questions;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    const filtered = questions.map((q, idx) => {
      const userAns = this.activeQuizState.userAnswers[idx];
      const isAnswered = userAns !== undefined;
      const isCorrect = isAnswered && userAns === q.correctAnswer;
      const isWrong = isAnswered && userAns !== q.correctAnswer;
      const isSkipped = !isAnswered;
      const isFlagged = this.activeQuizState.flagged.has(idx);

      return {
        q,
        idx,
        userAns,
        isCorrect,
        isWrong,
        isSkipped,
        isFlagged
      };
    }).filter(item => {
      if (filter === 'wrong') return item.isWrong || item.isSkipped;
      if (filter === 'correct') return item.isCorrect;
      if (filter === 'flagged') return item.isFlagged;
      return true;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
          <h3>No questions match this filter (${filter}).</h3>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(({ q, idx, userAns, isCorrect, isWrong, isSkipped }) => {
      let cardClass = isCorrect ? 'is-correct' : (isWrong ? 'is-wrong' : 'is-skipped');
      let badgeHtml = isCorrect 
        ? '<span class="review-status-badge correct">✓ Correct</span>'
        : (isWrong ? '<span class="review-status-badge wrong">✗ Incorrect</span>' : '<span class="review-status-badge skipped">⚠ Skipped</span>');

      let imgHtml = '';
      if (q.image) {
        imgHtml = `
          <div class="question-image-wrapper" style="margin-top: 0.75rem;">
            <img src="${q.image}" class="question-image" alt="Question illustration" onclick="app.openLightbox('${q.image}', 'Question ${idx + 1}')" />
            <div class="image-caption-bar">
              <span>${q.imageCaption || `Question ${idx + 1} Diagram`}</span>
              <span class="image-zoom-hint" onclick="app.openLightbox('${q.image}', 'Question ${idx + 1}')">🔍 Click to enlarge</span>
            </div>
          </div>
        `;
      }

      const choicesHtml = q.options.map((opt, optIdx) => {
        const isUserPick = userAns === optIdx;
        const isActualCorrect = q.correctAnswer === optIdx;

        let rowClass = 'review-choice-row';
        let marker = `<span style="opacity: 0.6; font-weight: 700;">${letters[optIdx]}.</span>`;

        if (isActualCorrect) {
          rowClass += ' actual-correct';
          marker = `<span style="color: var(--success); font-weight: 800;">✓ Correct Answer (${letters[optIdx]}):</span>`;
        } else if (isUserPick && !isCorrect) {
          rowClass += ' user-wrong';
          marker = `<span style="color: var(--danger); font-weight: 800;">✗ Your Answer (${letters[optIdx]}):</span>`;
        }

        return `
          <div class="${rowClass}">
            ${marker}
            <span>${opt}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="review-item-card ${cardClass}">
          <div class="review-item-header">
            <span class="question-badge">Question ${idx + 1}</span>
            ${badgeHtml}
          </div>
          <div style="font-size: 1.1rem; font-weight: 700; line-height: 1.4;">${q.question}</div>
          ${imgHtml}
          <div class="review-choices-compare">
            ${choicesHtml}
          </div>
          ${q.explanation ? `
            <div class="review-explanation-box">
              <strong style="color: var(--primary);">💡 Explanation & Notes:</strong><br/>
              ${q.explanation}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  /* ================= Retake / Smart Practice ================= */
  retakeQuiz(onlyMistakes = false) {
    if (!this.rawLoadedQuiz) return;

    if (onlyMistakes) {
      const wrongQuestions = [];
      this.currentQuiz.questions.forEach((q, idx) => {
        const userAns = this.activeQuizState.userAnswers[idx];
        if (userAns === undefined || userAns !== q.correctAnswer) {
          wrongQuestions.push(JSON.parse(JSON.stringify(q)));
        }
      });

      if (wrongQuestions.length === 0) {
        alert("You scored 100% correct! There are no mistakes to practice.");
        return;
      }

      const remedialQuiz = {
        id: "remedial-" + Date.now(),
        title: `Remedial Practice: ${this.rawLoadedQuiz.title}`,
        description: `Targeted review of the ${wrongQuestions.length} questions you missed.`,
        category: "Focused Practice",
        timeLimitMinutes: Math.max(5, Math.ceil(wrongQuestions.length * 1.5)),
        questions: wrongQuestions
      };

      this.loadQuizAndConfigure(remedialQuiz);
    } else {
      // Retake full quiz with fresh randomization
      this.loadQuizAndConfigure(JSON.parse(JSON.stringify(this.rawLoadedQuiz)));
    }
  }

  /* ================= Confetti Particle Animation ================= */
  triggerConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#38bdf8'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: Math.random() * 6 + 3,
        dx: (Math.random() - 0.5) * 16,
        dy: (Math.random() - 0.7) * 16,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10,
        tiltAngle: Math.random() * Math.PI,
        tiltAngleIncremental: (Math.random() * 0.07) + 0.05
      });
    }

    let animationId;
    let frames = 0;

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frames++;

      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.tiltAngle) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle) * 2 + p.dx * 0.3;
        p.dx *= 0.98;

        ctx.beginPath();
        ctx.lineWidth = p.r / 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
        ctx.stroke();
      });

      if (frames < 200) {
        animationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationId);
      }
    }

    render();
  }

  /* ================= Toast Notification ================= */
  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>🔔</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new QuizApp();
});
