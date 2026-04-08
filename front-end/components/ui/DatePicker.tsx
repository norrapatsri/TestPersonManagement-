'use client'

import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parse, isValid } from 'date-fns'
import { th } from 'date-fns/locale'
import 'react-day-picker/style.css'

interface DatePickerProps {
  value: string        // "YYYY-MM-DD"
  onChange: (value: string) => void
  placeholder?: string
  hasError?: boolean
}

export function DatePicker({ value, onChange, placeholder = 'เลือกวันเกิด', hasError }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [popupStyle, setPopupStyle] = useState({ top: 0, left: 0, width: 0 })
  const ref = useRef<HTMLDivElement>(null)

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const isValidDate = selected && isValid(selected)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setPopupStyle({ top: rect.bottom + 8, left: rect.left, width: rect.width })
    }
    setOpen((o) => !o)
  }

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1
          ${hasError
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'}
          bg-slate-800 text-left
          ${isValidDate ? 'text-white' : 'text-slate-500'}`}
      >
        <span>{isValidDate ? format(selected, 'dd/MM/yyyy') : placeholder}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed z-[9999] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 p-3"
          style={{ top: popupStyle.top, left: popupStyle.left }}
        >
          <style>{`
            .rdp-root { --rdp-accent-color: #6366f1; --rdp-accent-background-color: #312e81; }
            .rdp-day { color: #cbd5e1; font-size: 0.875rem; border-radius: 0.5rem; }
            .rdp-day:hover { background-color: #1e293b !important; }
            .rdp-selected .rdp-day_button { background-color: #6366f1; color: white; border-radius: 0.5rem; }
            .rdp-today .rdp-day_button { color: #818cf8; font-weight: 700; }
            .rdp-outside { color: #334155; }
            .rdp-caption_label { color: #f1f5f9; font-size: 0.875rem; font-weight: 600; }
            .rdp-head_cell { color: #64748b; font-size: 0.75rem; }
            .rdp-nav button { color: #94a3b8; border-radius: 0.5rem; }
            .rdp-nav button:hover { background-color: #1e293b; }
            .rdp-dropdown { background-color: #1e293b; color: #f1f5f9; border: 1px solid #334155; border-radius: 0.5rem; padding: 2px 4px; }
          `}</style>
          <DayPicker
            mode="single"
            selected={isValidDate ? selected : undefined}
            onSelect={handleSelect}
            locale={th}
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={new Date()}
            defaultMonth={isValidDate ? selected : new Date(2000, 0)}
          />
        </div>
      )}
    </div>
  )
}
