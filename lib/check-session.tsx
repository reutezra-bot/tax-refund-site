'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useReducer,
} from 'react';
import type { UploadedDocument } from '@/types/documents';
import type { YearAnswers, TaxYearUnit, CaseResult, CheckCase } from '@/types/case';
import { generateId } from '@/lib/utils';

// ── Stable SSR-safe empty state ───────────────────────────────────────────────
// No Math.random(), no browser APIs — server and client first render identical.
const SSR_INITIAL: CheckCase = {
  caseId: '',
  years: [],
  result: null,
};

function freshCase(): CheckCase {
  return { caseId: generateId(), years: [], result: null };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'HYDRATE'; caseData: CheckCase }
  | { type: 'ADD_YEAR'; year: number }
  | { type: 'REMOVE_YEAR'; year: number }
  | { type: 'SET_YEAR_DOCS'; year: number; docs: UploadedDocument[] }
  | { type: 'SET_YEAR_ANSWERS'; year: number; answers: YearAnswers }
  | { type: 'SET_CASE_RESULT'; result: CaseResult }
  | { type: 'RESET' };

function reducer(state: CheckCase, action: Action): CheckCase {
  switch (action.type) {
    case 'HYDRATE':
      return action.caseData;

    case 'ADD_YEAR': {
      if (state.years.find((u) => u.year === action.year)) return state;
      const newUnit: TaxYearUnit = { year: action.year, documents: [], answers: null };
      return {
        ...state,
        years: [...state.years, newUnit].sort((a, b) => b.year - a.year),
        result: null, // invalidate cached result
      };
    }

    case 'REMOVE_YEAR':
      return {
        ...state,
        years: state.years.filter((u) => u.year !== action.year),
        result: null,
      };

    case 'SET_YEAR_DOCS':
      return {
        ...state,
        years: state.years.map((u) =>
          u.year === action.year ? { ...u, documents: action.docs } : u,
        ),
        result: null, // changing docs invalidates result
      };

    case 'SET_YEAR_ANSWERS':
      return {
        ...state,
        years: state.years.map((u) =>
          u.year === action.year ? { ...u, answers: action.answers } : u,
        ),
        result: null, // changing answers invalidates result
      };

    case 'SET_CASE_RESULT':
      return { ...state, result: action.result };

    case 'RESET':
      return freshCase();

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface ContextValue {
  caseData: CheckCase;
  addYear: (year: number) => void;
  removeYear: (year: number) => void;
  setYearDocs: (year: number, docs: UploadedDocument[]) => void;
  setYearAnswers: (year: number, answers: YearAnswers) => void;
  setCaseResult: (result: CaseResult) => void;
  reset: () => void;
}

const CheckSessionContext = createContext<ContextValue | null>(null);

const useSafeLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useLayoutEffect;

// ── Provider ──────────────────────────────────────────────────────────────────

export function CheckSessionProvider({ children }: { children: React.ReactNode }) {
  const [caseData, dispatch] = useReducer(reducer, SSR_INITIAL);

  // Always start a fresh case on mount — no localStorage restore.
  // State persists only within a single React navigation session.
  // A browser refresh or new tab always gets a clean slate.
  useSafeLayoutEffect(() => {
    dispatch({ type: 'HYDRATE', caseData: freshCase() });
  }, []);

  const addYear = useCallback((year: number) => dispatch({ type: 'ADD_YEAR', year }), []);
  const removeYear = useCallback((year: number) => dispatch({ type: 'REMOVE_YEAR', year }), []);
  const setYearDocs = useCallback(
    (year: number, docs: UploadedDocument[]) => dispatch({ type: 'SET_YEAR_DOCS', year, docs }),
    [],
  );
  const setYearAnswers = useCallback(
    (year: number, answers: YearAnswers) => dispatch({ type: 'SET_YEAR_ANSWERS', year, answers }),
    [],
  );
  const setCaseResult = useCallback(
    (result: CaseResult) => dispatch({ type: 'SET_CASE_RESULT', result }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <CheckSessionContext.Provider
      value={{ caseData, addYear, removeYear, setYearDocs, setYearAnswers, setCaseResult, reset }}
    >
      {children}
    </CheckSessionContext.Provider>
  );
}

export function useCheckSession(): ContextValue {
  const ctx = useContext(CheckSessionContext);
  if (!ctx) throw new Error('useCheckSession must be used within CheckSessionProvider');
  return ctx;
}
