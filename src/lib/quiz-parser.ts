
export type QuestionType = 'mcq' | 'subjective';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: { id: string; text: string }[];
  correctAnswer: string; // For MCQ it's the option ID (A, B, C, D), for Subjective it's the full text
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

/**
 * [STABILITY_ANCHOR: QUIZ_PARSER_V1.0]
 * محرك تحليل النصوص لتحويل المذكرات والامتحانات إلى كائنات برمجية قابلة للاختبار.
 */
export function parseQuizText(text: string): Quiz {
  const lines = text.split('\n');
  const questions: QuizQuestion[] = [];
  let currentQuestion: Partial<QuizQuestion> | null = null;
  
  // Regex patterns
  const questionRegex = /^Q(\d+):?\s*(.*)/i;
  const optionRegex = /^([A-D])\.\s*(.*)/i;
  const bulletRegex = /^\s*•\s*(.*)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const qMatch = line.match(questionRegex);
    if (qMatch) {
      // Save previous question
      if (currentQuestion && currentQuestion.question) {
        questions.push(currentQuestion as QuizQuestion);
      }
      
      currentQuestion = {
        id: qMatch[1],
        question: qMatch[2],
        type: 'subjective', // Default to subjective until options are found
        correctAnswer: ''
      };
      
      // Look ahead for multiline question text
      let j = i + 1;
      while (j < lines.length && !lines[j].match(questionRegex) && !lines[j].match(optionRegex) && !lines[j].match(bulletRegex)) {
        if (lines[j].trim()) {
          currentQuestion.question += ' ' + lines[j].trim();
        }
        j++;
        i = j - 1;
      }
      continue;
    }

    if (currentQuestion) {
      const oMatch = line.match(optionRegex);
      if (oMatch) {
        currentQuestion.type = 'mcq';
        if (!currentQuestion.options) currentQuestion.options = [];
        currentQuestion.options.push({ id: oMatch[1], text: oMatch[2] });
        continue;
      }

      const bMatch = line.match(bulletRegex);
      if (bMatch) {
        if (currentQuestion.correctAnswer) currentQuestion.correctAnswer += '\n';
        currentQuestion.correctAnswer += bMatch[1];
        
        // Look ahead for multiline bullet content
        let j = i + 1;
        while (j < lines.length && !lines[j].match(questionRegex) && !lines[j].match(optionRegex) && !lines[j].match(bulletRegex)) {
          if (lines[j].trim()) {
            currentQuestion.correctAnswer += ' ' + lines[j].trim();
          }
          j++;
          i = j - 1;
        }
        continue;
      }
      
      // If it's not a question, option, or bullet, it might be the answer for an MCQ if it's a plain line following options
      if (currentQuestion.type === 'mcq' && !currentQuestion.correctAnswer) {
          // In some formats, the answer is just text that matches one of the options
          const text = line.toLowerCase();
          const matchingOption = currentQuestion.options?.find(opt => text.includes(opt.text.toLowerCase()) || text === opt.id.toLowerCase());
          if (matchingOption) {
              currentQuestion.correctAnswer = matchingOption.id;
          }
      } else if (currentQuestion.type === 'subjective' && !currentQuestion.correctAnswer) {
          // If no bullet but there is text following the question, it's the answer
          currentQuestion.correctAnswer = line;
      }
    }
  }

  // Push the last one
  if (currentQuestion && currentQuestion.question) {
    questions.push(currentQuestion as QuizQuestion);
  }

  return {
    title: "اختبار مخصص",
    questions
  };
}
