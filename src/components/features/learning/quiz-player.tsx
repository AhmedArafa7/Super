
"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizData {
  questions: Question[];
}

interface QuizPlayerProps {
  data: QuizData;
  onComplete?: (score: number) => void;
}

export function QuizPlayer({ data, onComplete }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = data.questions[currentIndex];
  const progress = ((currentIndex + 1) / data.questions.length) * 100;

  const handleSubmit = () => {
    if (!selectedOption) return;
    
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentIndex < data.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
      onComplete?.(score);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResult(false);
  };

  if (showResult) {
    const percentage = Math.round((score / data.questions.length) * 100);
    
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="size-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-primary/20">
          <Trophy className="size-12 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Assessment Complete</h2>
        <p className="text-muted-foreground mb-8">You've successfully synchronized with this knowledge node.</p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10">
          <div className="p-4 glass rounded-2xl border-white/5">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Score</p>
            <p className="text-2xl font-bold text-white">{score} / {data.questions.length}</p>
          </div>
          <div className="p-4 glass rounded-2xl border-white/5">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Accuracy</p>
            <p className="text-2xl font-bold text-primary">{percentage}%</p>
          </div>
        </div>

        <div className="flex flex-col w-full max-w-xs gap-3">
          <Button onClick={handleRestart} variant="outline" className="rounded-xl border-white/10 h-12 font-bold">
            <RotateCcw className="size-4 mr-2" /> Restart Module
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-6 md:p-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Knowledge Check</span>
          <h2 className="text-lg font-bold text-white">Question {currentIndex + 1} of {data.questions.length}</h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      </div>

      <Progress value={progress} className="h-1 mb-12 bg-white/5" />

      <div className="flex-1 space-y-8">
        <h3 className="text-xl md:text-2xl font-medium leading-relaxed">
          {currentQuestion.question}
        </h3>

        <RadioGroup 
          value={selectedOption || ""} 
          onValueChange={setSelectedOption}
          className="space-y-3"
          disabled={isAnswered}
        >
          {currentQuestion.options.map((option, i) => {
            const isCorrect = option === currentQuestion.correctAnswer;
            const isSelected = option === selectedOption;
            
            return (
              <div key={i} className="flex items-center">
                <RadioGroupItem value={option} id={`opt-${i}`} className="sr-only" />
                <Label
                  htmlFor={`opt-${i}`}
                  className={cn(
                    "flex items-center justify-between w-full p-5 rounded-2xl border transition-all cursor-pointer",
                    isSelected 
                      ? "bg-primary/10 border-primary text-white shadow-lg" 
                      : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10",
                    isAnswered && isCorrect && "bg-green-500/10 border-green-500/50 text-green-400",
                    isAnswered && isSelected && !isCorrect && "bg-red-500/10 border-red-500/50 text-red-400"
                  )}
                >
                  <span className="text-sm font-medium">{option}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="size-5 text-green-400" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="size-5 text-red-400" />}
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        {isAnswered && (
          <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-in slide-in-from-top-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="size-4 text-indigo-400" />
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Neural Insights</span>
            </div>
            <p className="text-sm text-indigo-100/80 leading-relaxed italic">
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      <div className="mt-12 pt-8 border-t border-white/5">
        {!isAnswered ? (
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedOption} 
            className="w-full h-14 bg-primary text-white hover:bg-primary/90 rounded-2xl font-bold shadow-lg shadow-primary/20"
          >
            Submit Answer
          </Button>
        ) : (
          <Button 
            onClick={handleNext} 
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg"
          >
            {currentIndex === data.questions.length - 1 ? "Finish Module" : "Continue Transmission"}
            <ArrowRight className="ml-2 size-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
