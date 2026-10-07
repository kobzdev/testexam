# 📝 ExamMaster - Interactive Quiz & Document Study Web App

A modern, responsive, and feature-packed web application designed to help you practice and answer quizzes from your document files (Word `.docx` with embedded pictures, plain text, or JSON).

---

## ✨ Key Features

1. **📁 Document & Image Upload**:
   - **Word Documents (`.docx`)**: Automatically extracts questions, multiple-choice options, answer keys, explanations, and **extracts all embedded pictures/diagrams directly from your Word file** into high-resolution images!
   - **Text / Markdown (`.txt`, `.md`)**: Supports standard question formatting with inline image URLs/base64 and marked answers (`*`, `Answer: B`, `Key: C`).
   - **JSON Quizzes (`.json`)**: Import and export complete quiz decks.
   - **Raw Text Paste**: Paste questions and answers directly into the input area.

2. **🖼️ Picture & Diagram Display**:
   - Displays diagrams, charts, and illustrations associated with questions.
   - **Click-to-Zoom Lightbox Modal**: Click on any picture during the quiz or in the review screen to view it full-screen.

3. **🎯 Interactive Quiz Taking**:
   - **Exam Mode**: Simulates real test conditions with optional timer and flags.
   - **Study / Practice Mode**: Instant green/red visual and audio feedback with immediate explanation reveals after each answer.
   - **Question Matrix Palette**: Jump to any question at any time (answered, unanswered, flagged).
   - **Keyboard Shortcuts**: Use keys `1`–`4` or `A`–`D` to select choices, `Enter`/`Right Arrow` for next, `Left Arrow` for previous, and `F` to flag.

4. **📊 Complete Scoring & Review Breakdown**:
   - **Animated Circular Score Gauge**: Displays percentage score and letter grade (A+, A, B, C, Needs Review).
   - **Summary Statistics**: Total Questions, Correct Count, Wrong Count, Skipped Count, Time Spent, and Accuracy %.
   - **Detailed Answer Breakdown**:
     - Shows each question with its diagram/picture.
     - Highlights **your answer** in red if incorrect.
     - Highlights the **actual correct answer** in emerald green.
     - Displays the explanation and rationale.
   - **Filter Tabs**: View *All Questions*, *Incorrect & Skipped Only*, *Correct Only*, or *Flagged Only*.
   - **🎯 Practice Only Mistakes (Smart Retest)**: Generates a remedial quiz session containing only the questions you got wrong.
   - **🖨️ Print / Save as PDF**: Formatted clean view for printing or saving your quiz results.

---

## 🚀 How to Run the Website

### Option 1: Direct File Launch
Simply double-click or open [index.html](file:///c:/Users/USER/OneDrive/Desktop/examtest/index.html) in any web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local Web Server
A local web server is also running at:
👉 **[http://localhost:8085/](http://localhost:8085/)**

To start the server manually in the terminal:
```bash
node server.js
```

---

## 📋 Recommended Document / Text Format

When creating `.docx` or `.txt` files for the parser:

```text
1. Refer to the diagram below. What is the primary function of the organelle labeled [X]?
[Insert picture in Word here or use image marker]
A. Synthesis of proteins and vesicle export
B. Generation of ATP chemical energy via cellular respiration
C. Storage of genetic DNA
D. Degradation of cellular waste
Answer: B
Explanation: Mitochondria generate most of the chemical energy needed by the cell (ATP).

2. What is the SI unit of electrical resistance?
A. Ampere
B. Volt
*C. Ohm
D. Watt
Answer: C
Explanation: The Ohm (symbol: Ω) is the SI unit of electrical resistance.
```

*Note: You can mark the correct answer with `Answer: B`, `Ans: B`, or place an asterisk `*` before the correct choice (e.g. `*C. Ohm`).*
