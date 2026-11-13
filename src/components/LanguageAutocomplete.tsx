import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';
import {
  useTranslation,
  LanguageOption,
  SupportedLanguage
} from '../services/i18nService';

interface LanguageAutocompleteProps {
  dropDirection?: 'up' | 'down';
  isAccessibilityMode?: boolean;
  compact?: boolean;
  className?: string;
  idPrefix?: string;
}

export default function LanguageAutocomplete({
  dropDirection = 'down',
  isAccessibilityMode = false,
  compact = false,
  className = '',
  idPrefix = 'lang-select'
}: LanguageAutocompleteProps) {
  const { lang, langOption, setLanguage, t, languages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredLanguages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return languages;
    return languages.filter(
      (opt) =>
        opt.englishName.toLowerCase().includes(q) ||
        opt.nativeName.toLowerCase().includes(q) ||
        opt.code.toLowerCase().includes(q) ||
        opt.regionLabel.toLowerCase().includes(q) ||
        opt.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [query, languages]);

  useEffect(() => {
    if (highlightedIndex >= filteredLanguages.length) {
      setHighlightedIndex(0);
    }
  }, [filteredLanguages.length, highlightedIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: LanguageOption) => {
    setLanguage(option.code as SupportedLanguage);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (filteredLanguages.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % filteredLanguages.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && filteredLanguages.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + filteredLanguages.length) % filteredLanguages.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filteredLanguages[highlightedIndex]) {
        handleSelect(filteredLanguages[highlightedIndex]);
      } else {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  };

  const displayValue = isOpen ? query : `${langOption.nativeName} (${langOption.englishName})`;
  const listboxId = `${idPrefix}-listbox`;

  return (
    <div ref={containerRef} className={`relative inline-flex items-center gap-2 ${className}`}>
      {!compact && (
        <label
          htmlFor={`${idPrefix}-input`}
          className={`text-[11px] font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            isAccessibilityMode ? 'text-slate-700' : 'text-slate-400'
          }`}
        >
          <Languages className={`h-3.5 w-3.5 ${isAccessibilityMode ? 'text-cyan-700' : 'text-cyan-400'}`} />
          <span>{t.langSelector.label}:</span>
        </label>
      )}

      <div className="relative">
        <div
          className={`flex items-center rounded-lg border transition-colors ${
            isAccessibilityMode
              ? 'bg-white border-slate-300 text-slate-900 focus-within:border-cyan-700'
              : 'bg-slate-950 border-slate-700/80 text-slate-100 focus-within:border-cyan-500'
          }`}
        >
          {compact && (
            <Languages
              className={`h-3.5 w-3.5 ms-2.5 shrink-0 ${
                isAccessibilityMode ? 'text-cyan-700' : 'text-cyan-400'
              }`}
            />
          )}
          <input
            ref={inputRef}
            id={`${idPrefix}-input`}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-label={t.langSelector.label}
            autoComplete="language"
            value={displayValue}
            placeholder={t.langSelector.placeholder}
            onFocus={() => {
              setIsOpen(true);
              setQuery('');
            }}
            onClick={() => {
              if (!isOpen) {
                setIsOpen(true);
                setQuery('');
              }
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className={`w-48 sm:w-56 bg-transparent px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer truncate ${
              isAccessibilityMode
                ? 'text-slate-900 placeholder:text-slate-400'
                : 'text-slate-100 placeholder:text-slate-500'
            }`}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={t.langSelector.label}
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
                setQuery('');
              } else {
                setIsOpen(true);
                setQuery('');
                inputRef.current?.focus();
              }
            }}
            className={`px-2 py-1.5 cursor-pointer transition ${
              isAccessibilityMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-150 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {isOpen && (
          <div
            id={listboxId}
            role="listbox"
            aria-label={t.langSelector.selectOneHint}
            className={`absolute end-0 z-50 w-64 max-h-64 overflow-y-auto rounded-xl border shadow-2xl py-1 ${
              dropDirection === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } ${
              isAccessibilityMode
                ? 'bg-white border-slate-300 text-slate-900'
                : 'bg-slate-950 border-slate-700 text-slate-100'
            }`}
          >
            <div
              className={`px-3 py-1.5 text-[10px] font-mono border-b ${
                isAccessibilityMode
                  ? 'text-slate-500 border-slate-200 bg-slate-50'
                  : 'text-slate-400 border-slate-800 bg-slate-900/60'
              }`}
            >
              {t.langSelector.selectOneHint}
            </div>

            {filteredLanguages.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">
                {t.langSelector.noMatch}
              </div>
            ) : (
              filteredLanguages.map((option, idx) => {
                const isSelected = option.code === lang;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={option.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(option)}
                    className={`w-full text-start px-3 py-2 text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                      isSelected
                        ? isAccessibilityMode
                          ? 'bg-cyan-50 text-cyan-900 font-semibold'
                          : 'bg-cyan-950/70 text-cyan-200 font-semibold'
                        : isHighlighted
                        ? isAccessibilityMode
                          ? 'bg-slate-100 text-slate-900'
                          : 'bg-slate-800/80 text-white'
                        : isAccessibilityMode
                        ? 'text-slate-800 hover:bg-slate-50'
                        : 'text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold">{option.nativeName}</span>
                        <span className="text-[11px] opacity-75">· {option.englishName}</span>
                      </div>
                      <div className="text-[10px] opacity-60 font-mono truncate">
                        {option.code.toUpperCase()} · {option.regionLabel}
                      </div>
                    </div>
                    {isSelected && (
                      <Check
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isAccessibilityMode ? 'text-cyan-700' : 'text-cyan-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
