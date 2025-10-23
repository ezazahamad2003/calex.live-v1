'use client';

import { useState } from 'react';
import type { Question } from '@/lib/api';

interface SmartFormProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  isLoading?: boolean;
}

export default function SmartForm({ questions, onSubmit, isLoading }: SmartFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    questions.forEach((q) => {
      if (q.required && !answers[q.key]?.trim()) {
        newErrors[q.key] = `${q.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(answers);
    }
  };

  const renderField = (question: Question) => {
    const value = answers[question.key] || '';
    const error = errors[question.key];
    const baseClasses =
      'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    const errorClasses = error ? 'border-red-500' : 'border-gray-300';

    switch (question.type) {
      case 'date':
        return (
          <input
            type="date"
            id={question.key}
            value={value}
            onChange={(e) => handleChange(question.key, e.target.value)}
            className={`${baseClasses} ${errorClasses}`}
            required={question.required}
          />
        );

      case 'select':
        return (
          <select
            id={question.key}
            value={value}
            onChange={(e) => handleChange(question.key, e.target.value)}
            className={`${baseClasses} ${errorClasses}`}
            required={question.required}
          >
            <option value="">-- Select --</option>
            {question.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            id={question.key}
            value={value}
            onChange={(e) => handleChange(question.key, e.target.value)}
            className={`${baseClasses} ${errorClasses}`}
            required={question.required}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {questions.map((question) => (
        <div key={question.key}>
          <label htmlFor={question.key} className="block text-sm font-medium text-gray-700 mb-2">
            {question.label}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(question)}
          {errors[question.key] && (
            <p className="mt-1 text-sm text-red-600">{errors[question.key]}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Submitting...' : 'Submit NDA Request'}
      </button>
    </form>
  );
}

