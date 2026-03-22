'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  accent?: 'pink' | 'purple' | 'muted'
}

interface Props {
  /** Renders a hidden <input name={name}> for form submission */
  name?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function CustomSelect({
  name,
  value,
  onChange,
  options,
  placeholder = '— Sélectionner —',
  disabled,
  size = 'md',
}: Props) {
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  // Determine if dropdown should open upward
  const handleOpen = () => {
    if (disabled) return
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setDropUp(spaceBelow < 180)
    }
    setOpen((o) => !o)
  }

  const selected = options.find((o) => o.value === value)

  const accentColor = (accent?: 'pink' | 'purple' | 'muted') => {
    if (accent === 'pink') return 'var(--color-neon-pink)'
    if (accent === 'purple') return 'var(--color-neon-purple)'
    return 'var(--color-text-primary)'
  }

  const px = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
  const optPx = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`w-full flex items-center justify-between gap-2 rounded-lg transition-all disabled:opacity-40 cursor-pointer ${px}`}
        style={{
          background: 'var(--color-bg-input)',
          border: `1px solid ${open ? 'var(--color-neon-purple)' : 'var(--color-border-subtle)'}`,
          color: selected ? accentColor(selected.accent) : 'var(--color-text-muted)',
          boxShadow: open ? '0 0 0 1px var(--color-neon-purple), 0 0 8px rgba(157,0,255,0.2)' : 'none',
        }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={size === 'sm' ? 12 : 14}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--color-text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={`absolute z-50 w-full rounded-xl overflow-hidden py-1 ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-glow)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(157,0,255,0.15)',
            minWidth: '100%',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`w-full flex items-center justify-between gap-2 text-left transition-colors ${optPx}`}
                style={{
                  color: isSelected ? accentColor(opt.accent) || 'var(--color-neon-purple)' : accentColor(opt.accent),
                  background: isSelected ? 'rgba(157,0,255,0.1)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSelected ? 'rgba(157,0,255,0.1)' : 'transparent'
                }}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check size={12} className="flex-shrink-0" style={{ color: 'var(--color-neon-purple)' }} />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
