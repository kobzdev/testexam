/**
 * Super Quiz Parser Engine
 * Handles Word (.docx), PDF text, Plain Text (.txt, .md), and JSON.
 * Auto-detects questions, inline/multiline choices, answer keys (inline or end-of-document),
 * explanations, and embedded images from tables, lists, and paragraphs.
 */

class QuizParser {
  static async parseFile(file) {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.docx')) {
      return await this.parseDocxFile(file);
    } else if (fileName.endsWith('.json')) {
      const text = await file.text();
      return this.parseJSON(text, file.name);
    } else {
      const text = await file.text();
      return this.parseRawText(text, file.name.replace(/\.[^/.]+$/, ""));
    }
  }

  static async parseDocxFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    
    if (typeof mammoth === 'undefined') {
      throw new Error("Mammoth.js library is not loaded. Please check your internet connection.");
    }

    const options = {
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      })
    };

    const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, options);
    return this.parseHtmlContent(result.value, file.name.replace(/\.docx$/i, ""));
  }

  static parseHtmlContent(html, title = "Imported Document Quiz") {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const rawBlocks = [];

    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const txt = node.textContent.trim();
        if (txt) {
          rawBlocks.push({ text: txt, html: node.textContent, images: [], isBold: false });
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const tag = node.tagName.toLowerCase();

      if (tag === 'table') {
        const rows = node.querySelectorAll('tr');
        rows.forEach(tr => {
          const cells = tr.querySelectorAll('td, th');
          const cellTexts = [];
          const cellImgs = [];
          cells.forEach(td => {
            const imgs = Array.from(td.querySelectorAll('img')).map(i => i.src);
            cellImgs.push(...imgs);
            cellTexts.push(td.innerText.trim());
          });
          const combinedText = cellTexts.filter(Boolean).join(' | ');
          if (combinedText || cellImgs.length > 0) {
            rawBlocks.push({
              text: combinedText,
              html: tr.innerHTML,
              images: cellImgs,
              isBold: false
            });
          }
        });
        return;
      }

      if (tag === 'img') {
        rawBlocks.push({
          text: '',
          html: node.outerHTML,
          images: [node.src],
          isBold: false
        });
        return;
      }

      const imgs = Array.from(node.querySelectorAll('img')).map(i => i.src);
      const isBold = tag === 'strong' || tag === 'b' || node.querySelector('strong, b') !== null;
      const text = (node.innerText || node.textContent || '').trim();

      if (text || imgs.length > 0) {
        if (['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'].includes(tag)) {
          rawBlocks.push({
            text: text,
            html: node.innerHTML,
            images: imgs,
            isBold: isBold
          });
        } else if (tag === 'ul' || tag === 'ol') {
          Array.from(node.children).forEach(child => processNode(child));
        } else {
          rawBlocks.push({
            text: text,
            html: node.innerHTML,
            images: imgs,
            isBold: isBold
          });
        }
      }
    }

    Array.from(tempDiv.childNodes).forEach(node => processNode(node));

    return this.parseExtractedBlocks(rawBlocks, title);
  }

  static parseRawText(rawText, title = "Pasted Quiz") {
    if (!rawText || !rawText.trim()) {
      throw new Error("The input text is empty.");
    }

    const lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const blocks = [];

    for (let line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine) continue;

      const imgs = [];
      const imgMdMatch = cleanLine.match(/!\[.*?\]\((.*?)\)/);
      const imgTagMatch = cleanLine.match(/<img[^>]+src=["']([^"']+)["']/i);
      const imgBrkMatch = cleanLine.match(/\[img:\s*(.*?)\]/i);

      if (imgMdMatch) imgs.push(imgMdMatch[1]);
      else if (imgTagMatch) imgs.push(imgTagMatch[1]);
      else if (imgBrkMatch) imgs.push(imgBrkMatch[1]);

      const strippedText = cleanLine
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/<img[^>]*>/gi, '')
        .replace(/\[img:\s*.*?\]/gi, '')
        .trim();

      blocks.push({
        text: strippedText,
        html: cleanLine,
        images: imgs,
        isBold: /\*\*.*?\*\*/.test(cleanLine) || /<b>|<strong>/.test(cleanLine)
      });
    }

    return this.parseExtractedBlocks(blocks, title);
  }

  /**
   * Universal Block Parser: Smart Multi-Pattern Question & Choice Assembler
   */
  static parseExtractedBlocks(blocks, title) {
    const answerKeyMap = this.extractAnswerKeySection(blocks);

    const questions = [];
    let currentQ = null;
    let pendingImages = [];
    let lastOptionLetter = null;

    const questionStartRegex = /^(?:(?:Question|Item|Problem|Q\.?)\s*#?\s*(\d+)[\.\)\:\-]?|(\d+)[\.\)\:\-]|#\s*(\d+))\s*(.*)/i;
    const singleOptionRegex = /^[\*•\-]?\s*(?:\(?([A-Ha-h])[\)\.\:\-\]]|\[([A-Ha-h])\])\s*(.*)/;
    const answerLineRegex = /^(?:Answer|Ans|Correct\s*Answer|Key|Correct)\b\s*[:=\-]?\s*[\(\[]?([A-Ha-h1-8])[\)\]\.]?/i;
    const inlineAnswerRegex = /\b(?:Answer|Ans|Correct\s*Answer|Key|Correct)\s*[:=\-]\s*[\(\[]?([A-Ha-h1-8])[\)\]\.]?\s*$/i;
    const explanationRegex = /^(?:Explanation|Rationale|Note|Solution|Notes)\s*[:=\-]?\s*(.*)/i;
    const aiAnnotationRegex = /^(?:(?:Claud|Gemini|Chatgpt|Copilot|allAIanswer|AI\s*Answer)[\w\/\s\:\-]*)/i;

    function finalizeQuestion() {
      if (currentQ && (currentQ.question || currentQ.options.length > 0)) {
        // Clean question text
        currentQ.question = currentQ.question
          .replace(/^(?:(?:Question|Item|Problem|Q\.?)\s*#?\s*\d+[\.\)\:\-]?|\d+[\.\)\:\-])\s*/i, '')
          .replace(/\s*(?:Options|Choices)\s*:\s*$/i, '')
          .trim();

        if (!currentQ.question) {
          currentQ.question = `Question ${currentQ.id}`;
        }

        // Filter out empty options or pure placeholder options if valid options exist
        const nonEmptyOptions = currentQ.options.filter(opt => opt && opt.trim());
        if (nonEmptyOptions.length >= 2) {
          currentQ.options = nonEmptyOptions;
        }

        // If options count is 0, provide defaults
        if (currentQ.options.length === 0) {
          currentQ.options = ["Option A", "Option B", "Option C", "Option D"];
        }

        // Deduplicate choices if same letters were repeated (e.g. A), B)... then A.Option A)
        if (currentQ.options.length > 8) {
          // If 10 options where first 5 were dummy, keep last 5
          const half = Math.floor(currentQ.options.length / 2);
          if (currentQ.options.slice(0, half).every(opt => /^Option\s+[A-E]$/i.test(opt))) {
            currentQ.options = currentQ.options.slice(half);
          }
        }

        // Apply bottom Answer Key Map if no answer found
        if ((currentQ.correctAnswer === null || currentQ.correctAnswer === undefined) && answerKeyMap.has(currentQ.qNumber)) {
          const mappedAns = answerKeyMap.get(currentQ.qNumber);
          if (typeof mappedAns === 'number') {
            currentQ.correctAnswer = mappedAns;
          }
        }

        // Default to 0 if still null
        if (currentQ.correctAnswer === null || currentQ.correctAnswer === undefined || currentQ.correctAnswer < 0 || currentQ.correctAnswer >= currentQ.options.length) {
          currentQ.correctAnswer = 0;
        }

        questions.push(currentQ);
      }
      currentQ = null;
      lastOptionLetter = null;
    }

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      let text = (block.text || '').trim();
      const images = block.images || [];

      if (images.length > 0) {
        if (currentQ) {
          if (!currentQ.image) currentQ.image = images[0];
        } else {
          pendingImages.push(...images);
        }
      }

      if (!text) continue;

      // Skip standalone "Options:" line
      if (/^(?:Options|Choices)\s*:\s*$/i.test(text)) {
        continue;
      }

      // Skip bottom answer key header
      if (/^(?:Answer\s*Key|Answers\s*Key|Answers\s*:)/i.test(text)) {
        continue;
      }

      // Check if text is AI annotation like "Claud/Gemini: A"
      if (aiAnnotationRegex.test(text)) {
        if (currentQ && !currentQ.explanation) {
          currentQ.explanation = text;
        }
        continue;
      }

      // Check if line is purely an Answer line: e.g. "Answer : D" or "Answer: C"
      const ansMatch = text.match(answerLineRegex);
      if (ansMatch) {
        if (currentQ) {
          const char = ansMatch[1].trim().toUpperCase();
          if (/^[A-H]$/.test(char)) {
            currentQ.correctAnswer = char.charCodeAt(0) - 65;
          } else if (/^\d+$/.test(char)) {
            currentQ.correctAnswer = Math.max(0, parseInt(char, 10) - 1);
          }
        }
        continue;
      }

      // Check if line contains an inline Answer at the end of option text (e.g. "D. ... to encrypt the data Answer: C")
      const inlineAnsMatch = text.match(inlineAnswerRegex);
      let inlineCorrectAnswer = null;
      if (inlineAnsMatch && !text.match(questionStartRegex)) {
        const ansChar = inlineAnsMatch[1].trim().toUpperCase();
        if (/^[A-H]$/.test(ansChar)) {
          inlineCorrectAnswer = ansChar.charCodeAt(0) - 65;
        }
        // Remove "Answer: X" from the end of text safely
        text = text.replace(inlineAnswerRegex, '').trim();
      }

      // Check for inline choices on the same line (e.g. "A. Cat B. Dog C. Bird D. Fish")
      const inlineChoices = this.splitInlineChoices(text);
      if (inlineChoices.length >= 2) {
        if (!currentQ) {
          currentQ = {
            id: questions.length + 1,
            qNumber: questions.length + 1,
            question: `Question ${questions.length + 1}`,
            options: [],
            correctAnswer: null,
            explanation: "",
            image: pendingImages.length > 0 ? pendingImages.shift() : null
          };
        }

        inlineChoices.forEach(choice => {
          const optIndex = currentQ.options.length;
          currentQ.options.push(choice.text);
          if (choice.isCorrect) {
            currentQ.correctAnswer = optIndex;
          }
        });
        if (inlineCorrectAnswer !== null) {
          currentQ.correctAnswer = inlineCorrectAnswer;
        }
        continue;
      }

      // Check for explicit Question header (e.g. "1. Question", "13.When...", "34.")
      const qMatch = text.match(questionStartRegex);
      const isExplicitQ = qMatch && !text.match(singleOptionRegex) && !ansMatch && !text.match(explanationRegex);

      if (isExplicitQ) {
        finalizeQuestion();
        const qNum = parseInt(qMatch[1] || qMatch[2] || qMatch[3] || (questions.length + 1), 10);
        let qBody = (qMatch[4] || "").trim();

        // If qBody contains inline choices
        const subInline = this.splitQuestionAndInlineChoices(qBody);
        if (subInline) {
          currentQ = {
            id: questions.length + 1,
            qNumber: qNum,
            question: subInline.questionText || text,
            options: [],
            correctAnswer: null,
            explanation: "",
            image: pendingImages.length > 0 ? pendingImages.shift() : null
          };
          subInline.choices.forEach(ch => {
            const optIdx = currentQ.options.length;
            currentQ.options.push(ch.text);
            if (ch.isCorrect) currentQ.correctAnswer = optIdx;
          });
        } else {
          currentQ = {
            id: questions.length + 1,
            qNumber: qNum,
            question: qBody || text,
            options: [],
            correctAnswer: null,
            explanation: "",
            image: pendingImages.length > 0 ? pendingImages.shift() : null
          };
        }
        if (inlineCorrectAnswer !== null) {
          currentQ.correctAnswer = inlineCorrectAnswer;
        }
        continue;
      }

      // Check for Explanation line
      const expMatch = text.match(explanationRegex);
      if (expMatch) {
        if (currentQ) {
          currentQ.explanation = (currentQ.explanation ? currentQ.explanation + " " : "") + (expMatch[1] || text);
        }
        continue;
      }

      // Check for single Option line (A. / B. / C. / D. / A) / B) ...)
      const optMatch = text.match(singleOptionRegex);
      if (optMatch) {
        if (!currentQ) {
          currentQ = {
            id: questions.length + 1,
            qNumber: questions.length + 1,
            question: `Question ${questions.length + 1}`,
            options: [],
            correctAnswer: null,
            explanation: "",
            image: pendingImages.length > 0 ? pendingImages.shift() : null
          };
        }

        const optLetter = (optMatch[1] || optMatch[2] || "").toUpperCase();
        let optText = (optMatch[3] || "").trim();
        let isCorrect = false;

        // If option was marked with asterisk or bold
        if (
          text.startsWith('*') || 
          text.endsWith('*') || 
          /\(correct\)/i.test(text) || 
          /\[x\]/i.test(text) || 
          /\(answer\)/i.test(text) ||
          block.isBold
        ) {
          isCorrect = true;
        }

        optText = optText
          .replace(/\(correct\)/gi, '')
          .replace(/\[x\]/gi, '')
          .replace(/\(answer\)/gi, '')
          .replace(/\*$/, '')
          .trim();

        // If this is option A again after we already had options (and previous options were empty or dummy), reset options
        if (optLetter === 'A' && currentQ.options.length > 0) {
          if (currentQ.options.every(o => !o || /^Option\s+[A-E]$/i.test(o))) {
            currentQ.options = [];
          }
        }

        const optIndex = currentQ.options.length;
        currentQ.options.push(optText); // Keep raw text (empty if on next line)
        lastOptionLetter = optLetter;

        if (isCorrect) {
          currentQ.correctAnswer = optIndex;
        }
        if (inlineCorrectAnswer !== null) {
          currentQ.correctAnswer = inlineCorrectAnswer;
        }
        continue;
      }

      // Fallback: If we are inside an active question
      if (currentQ) {
        // If question has no options yet, append to question text
        if (currentQ.options.length === 0) {
          currentQ.question += "\n" + text;
        } else {
          // If we have options, append text to the latest option
          const lastIdx = currentQ.options.length - 1;
          if (currentQ.options[lastIdx] === "" || currentQ.options[lastIdx] === undefined) {
            currentQ.options[lastIdx] = text;
          } else {
            currentQ.options[lastIdx] += "\n" + text;
          }
        }
        if (inlineCorrectAnswer !== null) {
          currentQ.correctAnswer = inlineCorrectAnswer;
        }
      } else {
        // Start a new question
        currentQ = {
          id: questions.length + 1,
          qNumber: questions.length + 1,
          question: text,
          options: [],
          correctAnswer: inlineCorrectAnswer,
          explanation: "",
          image: pendingImages.length > 0 ? pendingImages.shift() : null
        };
      }
    }

    finalizeQuestion();

    if (questions.length === 0) {
      throw new Error("No questions could be identified. Please check the document format.");
    }

    return {
      id: "quiz-" + Date.now(),
      title: title || "Imported Quiz",
      description: `Successfully loaded ${questions.length} questions.`,
      category: "Document Exam",
      timeLimitMinutes: Math.max(5, Math.ceil(questions.length * 1.5)),
      questions: this.validateQuestions(questions)
    };
  }

  static extractAnswerKeySection(blocks) {
    const map = new Map();
    let isKeySection = false;

    for (let block of blocks) {
      const text = block.text || '';
      if (/^(?:Answer\s*Key|Answers\s*Key|Answers\s*:|Keys\s*:)/i.test(text)) {
        isKeySection = true;
      }

      if (isKeySection) {
        const matches = text.matchAll(/(\d+)[\.\)\:\-\s]+([A-Ha-h])/g);
        for (let m of matches) {
          const qNum = parseInt(m[1], 10);
          const ansChar = m[2].toUpperCase();
          const ansIdx = ansChar.charCodeAt(0) - 65;
          map.set(qNum, ansIdx);
        }
      }
    }

    return map;
  }

  static splitInlineChoices(text) {
    const inlinePattern = /(?:^|\s+)([\*•\-]?\s*[\(\[]?([A-Ha-h])[\)\]\.\:\-]\s*)(.*?)(?=(?:\s+[\*•\-]?\s*[\(\[]?[A-Ha-h][\)\]\.\:\-]\s*)|$)/gi;
    const matches = Array.from(text.matchAll(inlinePattern));

    if (matches.length < 2) return [];

    return matches.map(m => {
      let rawPrefix = m[1];
      let char = m[2].toUpperCase();
      let optBody = (m[3] || "").trim();
      let isCorrect = rawPrefix.includes('*') || optBody.includes('*') || /\(correct\)/i.test(optBody);

      optBody = optBody.replace(/\(correct\)/gi, '').replace(/\*$/, '').trim();

      return {
        letter: char,
        text: optBody || `Option ${char}`,
        isCorrect: isCorrect
      };
    });
  }

  static splitQuestionAndInlineChoices(text) {
    const firstOptIndex = text.search(/(?:^|\s+)[\(\[]?[A-Ha-h][\)\]\.\:\-]\s+/);
    if (firstOptIndex <= 0) return null;

    const qText = text.substring(0, firstOptIndex).trim();
    const choicesText = text.substring(firstOptIndex).trim();
    const choices = this.splitInlineChoices(choicesText);

    if (choices.length >= 2) {
      return {
        questionText: qText,
        choices: choices
      };
    }
    return null;
  }

  static parseJSON(jsonString, defaultTitle = "JSON Quiz") {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        return {
          id: "quiz-" + Date.now(),
          title: defaultTitle,
          description: "Quiz loaded from JSON array",
          category: "General",
          timeLimitMinutes: Math.max(5, Math.ceil(data.length * 1.5)),
          questions: this.validateQuestions(data)
        };
      } else if (data && typeof data === 'object' && Array.isArray(data.questions)) {
        return {
          id: data.id || ("quiz-" + Date.now()),
          title: data.title || defaultTitle,
          description: data.description || "Imported Quiz Deck",
          category: data.category || "General",
          timeLimitMinutes: data.timeLimitMinutes || Math.max(5, Math.ceil(data.questions.length * 1.5)),
          questions: this.validateQuestions(data.questions)
        };
      } else {
        throw new Error("Invalid JSON structure: Expected an array of questions or an object with 'questions' array.");
      }
    } catch (err) {
      throw new Error("JSON Parse Error: " + err.message);
    }
  }

  static validateQuestions(rawQuestions) {
    return rawQuestions.map((q, idx) => {
      const id = q.id || (idx + 1);
      const questionText = (q.question || q.title || `Question ${id}`).trim();

      let options = [];
      if (Array.isArray(q.options)) {
        options = q.options.map(opt => typeof opt === 'string' ? opt.trim() : String(opt));
      } else if (q.choices && Array.isArray(q.choices)) {
        options = q.choices.map(opt => typeof opt === 'string' ? opt.trim() : String(opt));
      }

      if (options.length === 0) {
        options = ["Option A", "Option B", "Option C", "Option D"];
      }

      let correctAnswer = 0;
      if (typeof q.correctAnswer === 'number') {
        correctAnswer = Math.max(0, Math.min(options.length - 1, q.correctAnswer));
      } else if (typeof q.correctAnswer === 'string') {
        const char = q.correctAnswer.trim().toUpperCase();
        if (/^[A-H]$/.test(char)) {
          correctAnswer = char.charCodeAt(0) - 65;
        } else if (!isNaN(parseInt(char, 10))) {
          correctAnswer = Math.max(0, parseInt(char, 10) - 1);
        }
      } else if (typeof q.answer === 'number') {
        correctAnswer = Math.max(0, Math.min(options.length - 1, q.answer));
      } else if (typeof q.answer === 'string') {
        const char = q.answer.trim().toUpperCase();
        if (/^[A-H]$/.test(char)) {
          correctAnswer = char.charCodeAt(0) - 65;
        }
      }

      return {
        id: id,
        question: questionText,
        options: options,
        correctAnswer: Math.max(0, Math.min(options.length - 1, correctAnswer)),
        explanation: q.explanation || q.rationale || "",
        image: q.image || q.imageUrl || q.picture || null,
        imageCaption: q.imageCaption || ""
      };
    });
  }

  static exportQuizToJSON(quizObj) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quizObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${quizObj.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_quiz.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

if (typeof window !== 'undefined') {
  window.QuizParser = QuizParser;
}
if (typeof module !== 'undefined') {
  module.exports = QuizParser;
}
