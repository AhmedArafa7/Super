
"use client";

import React, { useState, useMemo } from "react";
import { 
  GraduationCap, BookOpen, Send, CheckCircle2, 
  XCircle, ChevronRight, ChevronLeft, RefreshCcw,
  FileText, ClipboardList, TrendingUp, AlertCircle,
  Eye, Save, History, Award, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { parseQuizText, Quiz, QuizQuestion } from "@/lib/quiz-parser";

/**
 * [STABILITY_ANCHOR: STUDY_QUIZ_VIEW_V1.0]
 * المساعد الدراسي الذكي - تحويل المذكرات والامتحانات إلى تجربة تفاعلية.
 */
export function StudyQuizView() {
  const [inputText, setInputText] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [revealedSubjective, setRevealedSubjective] = useState<Record<string, boolean>>({});

  const handleStartQuiz = () => {
    if (!inputText.trim()) return;
    const parsedQuiz = parseQuizText(inputText);
    if (parsedQuiz.questions.length === 0) return;
    setQuiz(parsedQuiz);
    setIsTakingQuiz(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setRevealedSubjective({});
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (quiz?.questions.length || 0) - 1;

  const score = useMemo(() => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach(q => {
      if (q.type === 'mcq' && userAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.questions.filter(q => q.type === 'mcq').length || 1) * 100);
  }, [quiz, userAnswers]);

  if (showResults && quiz) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <header className="text-center space-y-4">
          <div className="size-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-400 border border-indigo-500/20 shadow-xl">
            <Award className="size-10" />
          </div>
          <h1 className="text-4xl font-black text-white">نتائج الاختبار</h1>
          <p className="text-muted-foreground text-lg">لقد أكملت الاختبار بنجاح. إليك ملخص أدائك.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass border-green-500/20 rounded-[2rem] bg-green-500/5">
            <CardContent className="p-8 text-center text-right">
              <TrendingUp className="size-8 text-green-400 mb-4 ml-auto" />
              <p className="text-3xl font-black text-white">{score}%</p>
              <p className="text-sm text-green-400 font-bold uppercase tracking-widest">معدل الإتقان (MCQ)</p>
            </CardContent>
          </Card>

          <Card className="glass border-indigo-500/20 rounded-[2rem] bg-indigo-500/5">
            <CardContent className="p-8 text-center text-right">
              <ClipboardList className="size-8 text-indigo-400 mb-4 ml-auto" />
              <p className="text-3xl font-black text-white">{quiz.questions.length}</p>
              <p className="text-sm text-indigo-400 font-bold uppercase tracking-widest">إجمالي الأسئلة</p>
            </CardContent>
          </Card>

          <Card className="glass border-amber-500/20 rounded-[2rem] bg-amber-500/5">
            <CardContent className="p-8 text-center text-right">
              <History className="size-8 text-amber-400 mb-4 ml-auto" />
              <p className="text-3xl font-black text-white">{Object.keys(userAnswers).length}</p>
              <p className="text-sm text-amber-400 font-bold uppercase tracking-widest">الأسئلة المجابة</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 pb-20">
          <h2 className="text-2xl font-bold text-white text-right mb-6">مراجعة الإجابات</h2>
          {quiz.questions.map((q, idx) => (
            <Card key={q.id} className="glass border-white/5 rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 flex-row-reverse">
                  <Badge className={cn(
                    "rounded-lg px-3 py-1",
                    q.type === 'mcq' 
                      ? (userAnswers[q.id] === q.correctAnswer ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")
                      : "bg-indigo-500/20 text-indigo-400"
                  )}>
                    {q.type === 'mcq' ? (userAnswers[q.id] === q.correctAnswer ? "صحيحة" : "خاطئة") : "مقالي - تقييم ذاتي"}
                  </Badge>
                  <div className="text-right flex-1">
                    <p className="text-sm text-muted-foreground mb-1">السؤال {idx + 1}</p>
                    <p className="text-xl font-bold text-white mb-4">{q.question}</p>
                  </div>
                </div>
                
                <div className="bg-black/40 rounded-2xl p-6 mt-4 space-y-4 text-right">
                  {q.type === 'mcq' ? (
                    <>
                      <div className="flex items-center gap-3 justify-end text-sm">
                        <span className="text-white">{q.options?.find(o => o.id === q.correctAnswer)?.text}</span>
                        <span className="text-green-400 font-bold">:الإجابة الصحيحة</span>
                      </div>
                      <div className="flex items-center gap-3 justify-end text-sm">
                        <span className={userAnswers[q.id] === q.correctAnswer ? "text-green-400" : "text-red-400"}>
                          {q.options?.find(o => o.id === userAnswers[q.id])?.text || "لم تتم الإجابة"}
                        </span>
                        <span className="text-muted-foreground font-bold">:إجابتك</span>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs text-indigo-400 font-bold uppercase tracking-widest block">الإجابة النموذجية</Label>
                        <p className="text-sm text-white/90 leading-relaxed bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">{q.correctAnswer}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-bold uppercase tracking-widest block">إجابتك</Label>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 italic">
                          {userAnswers[q.id] || "لم تكتب إجابة"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center pt-8">
            <Button 
                onClick={() => { setShowResults(false); setIsTakingQuiz(false); }}
                className="bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-14 px-10 text-lg font-bold shadow-xl"
            >
                <RefreshCcw className="size-5 mr-3" />
                بدأ اختبار جديد
            </Button>
        </div>
      </div>
    );
  }

  if (isTakingQuiz && quiz && currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-8 animate-in slide-in-from-bottom-10 duration-500">
        <header className="flex items-center justify-between flex-row-reverse mb-8 pt-4">
          <div className="text-right">
            <h2 className="text-2xl font-black text-white flex items-center gap-3 flex-row-reverse">
              <GraduationCap className="size-6 text-indigo-400" />
              مساعد الدراسة الذكي
            </h2>
            <p className="text-sm text-muted-foreground">أنت تختبر معلوماتك الآن</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-indigo-400">{currentQuestionIndex + 1} / {quiz.questions.length}</span>
            <Progress value={((currentQuestionIndex + 1) / quiz.questions.length) * 100} className="w-32 h-2 bg-white/5" />
          </div>
        </header>

        <Card className="glass border-indigo-500/20 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-500/5 to-transparent relative min-h-[400px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <CardHeader className="p-10 pb-4 text-right">
            <Badge className="bg-indigo-500/20 text-indigo-400 mb-4 w-fit ml-auto border-indigo-500/30 uppercase tracking-widest text-[10px]">
              {currentQuestion.type === 'mcq' ? "سؤال اختياري" : "سؤال مقالي"}
            </Badge>
            <CardTitle className="text-3xl font-headline font-bold text-white leading-tight">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-6">
            <div className="space-y-4">
              {currentQuestion.type === 'mcq' ? (
                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options?.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswerSelect(currentQuestion.id, opt.id)}
                      className={cn(
                        "flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 flex-row-reverse text-right group",
                        userAnswers[currentQuestion.id] === opt.id 
                          ? "bg-indigo-500 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]" 
                          : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-4 flex-row-reverse">
                        <div className={cn(
                          "size-10 rounded-xl flex items-center justify-center font-bold transition-all",
                          userAnswers[currentQuestion.id] === opt.id ? "bg-white text-indigo-600" : "bg-white/10 text-white"
                        )}>{opt.id}</div>
                        <span className="text-lg font-medium">{opt.text}</span>
                      </div>
                      {userAnswers[currentQuestion.id] === opt.id && <CheckCircle2 className="size-6 text-white" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <Textarea
                    dir="auto"
                    placeholder="اكتب إجابتك هنا..."
                    className="flex-1 min-h-[180px] bg-black/40 border-indigo-500/20 rounded-2xl text-xl p-6 focus-visible:ring-indigo-500 leading-relaxed shadow-inner font-quran"
                    value={userAnswers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                  />
                  
                  {revealedSubjective[currentQuestion.id] && (
                    <div className="animate-in slide-in-from-top-4 duration-500">
                      <Label className="text-xs text-indigo-400 font-bold uppercase tracking-widest block text-right mb-2">الإجابة النموذجية للمقارنة</Label>
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 text-right text-indigo-100/90 leading-relaxed italic">
                        {currentQuestion.correctAnswer}
                      </div>
                    </div>
                  )}

                  {!revealedSubjective[currentQuestion.id] && (
                    <Button 
                      variant="ghost" 
                      onClick={() => setRevealedSubjective(prev => ({ ...prev, [currentQuestion.id]: true }))}
                      className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 mx-auto block rounded-xl font-bold"
                    >
                      <Eye className="size-4 mr-2" /> إظهار الإجابة النموذجية
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between flex-row-reverse gap-4">
          <Button
            size="lg"
            onClick={isLastQuestion ? () => setShowResults(true) : () => setCurrentQuestionIndex(prev => prev + 1)}
            disabled={!userAnswers[currentQuestion.id]}
            className="bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-14 px-10 text-lg font-bold shadow-xl shadow-indigo-500/20 flex-1 flex-row-reverse gap-3"
          >
            {isLastQuestion ? "إنهاء الاختبار والنتائج" : "السؤال التالي"}
            <ChevronLeft className="size-6" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
            className="rounded-2xl h-14 px-8 border-white/10 bg-white/5 text-muted-foreground hover:text-white"
          >
            <ChevronRight className="size-6" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-12 animate-in fade-in duration-700">
      <header className="text-right space-y-4">
        <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 px-4 py-1.5 uppercase tracking-widest font-black text-[10px]">Study AI Engine V1.0</Badge>
        <h1 className="text-6xl font-headline font-bold text-white tracking-tight flex items-center gap-6 justify-end">
          المساعد الدراسي الذكي
          <GraduationCap className="text-indigo-500 size-14" />
        </h1>
        <p className="text-muted-foreground text-xl max-w-2xl ml-auto">
          حول مذكراتك، محاضراتك، أو حتى ملفات الامتحانات السابقة إلى تجربة تعليمية تفاعلية بلمسة واحدة.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="glass border-white/5 rounded-[3rem] overflow-hidden p-8 flex flex-col justify-between bg-gradient-to-br from-indigo-500/5 to-transparent border-t border-indigo-500/10">
          <div className="space-y-6">
            <div className="size-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-2 ml-auto shadow-inner border border-indigo-500/10">
              <FileText className="size-8" />
            </div>
            <div className="text-right">
              <h3 className="text-2xl font-bold text-white mb-2">النص المصدر للاختبار</h3>
              <p className="text-muted-foreground leading-relaxed">انسخ محتوى الـ PDF أو المحاضرة هنا. سأقوم باستخراج الأسئلة بشكل تلقائي وتحويلها إلى اختبار تفاعلي.</p>
            </div>
            
            <Textarea
              dir="auto"
              placeholder="الصق نص المذكرات أو الأسئلة هنا..."
              className="min-h-[300px] bg-black/40 border-white/10 rounded-[2rem] text-lg p-8 focus-visible:ring-indigo-500 leading-relaxed shadow-xl"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleStartQuiz}
            disabled={!inputText.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] h-16 text-xl font-bold mt-8 shadow-2xl shadow-indigo-600/20 gap-3"
          >
            بدأ استخراج الأسئلة والاختبار
            <Send className="size-6" />
          </Button>
        </Card>

        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4">
            {[
              { title: "دعم الأسئلة الاختيارية", desc: "تصحيح تلقائي فوري لخيارات A, B, C, D.", icon: CheckCircle2, color: "text-green-400" },
              { title: "دعم الأسئلة المقالية", desc: "مقارنة إجابتك بالإجابة النموذجية للتقييم الذاتي.", icon: BookOpen, color: "text-blue-400" },
              { title: "تحليل ذكي للنصوص", desc: "يتعرف على هيكلية الأسئلة والبسملة وعناصر التنسيق.", icon: Layers, color: "text-indigo-400" },
              { title: "نتائج دقيقة", desc: "رصد لمستوى الإتقان وتتبع التقدم الدراسي.", icon: TrendingUp, color: "text-amber-400" }
            ].map((feature, i) => (
              <Card key={i} className="glass border-white/5 rounded-3xl hover:bg-white/5 transition-all group p-6">
                <div className="flex items-center gap-6 flex-row-reverse text-right">
                  <div className={cn("size-12 rounded-2xl flex items-center justify-center bg-white/5 group-hover:scale-110 transition-transform shadow-inner", feature.color)}>
                    <feature.icon className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] p-8 flex items-center gap-6 flex-row-reverse text-right">
            <div className="size-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl">
              <AlertCircle className="size-8" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">تلميحات هامة</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">يفضل أن يكون النص مرتباً بـ Q1، Q2 لتسهيل عملية الاستخراج. في الأسئلة المقالية، حاول كتابة إجابات مفصلة لتقارنها بدقة مع النموذج.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
