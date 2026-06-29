'use client'

import { PersonSize } from '@/lib/catalog'

const sizes: { value: PersonSize; label: string; desc: string }[] = [
  { value: 'XS', label: 'XS', desc: '32-34' },
  { value: 'S', label: 'S', desc: '34-36' },
  { value: 'M', label: 'M', desc: '38-40' },
  { value: 'L', label: 'L', desc: '42-44' },
  { value: 'XL', label: 'XL', desc: '46-48' },
  { value: 'XXL', label: 'XXL', desc: '50-52' },
]

interface SizePickerProps {
  value: PersonSize | null
  onChange: (s: PersonSize) => void
}

export default function SizePicker({ value, onChange }: SizePickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-300">Tu talla</p>
        <p className="text-xs text-gray-500">Talla en cm de pecho</p>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {sizes.map(({ value: s, label, desc }) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`flex flex-col items-center py-2 rounded-xl transition ${
              value === s
                ? 'bg-gradient-to-b from-brand-500 to-accent-500 text-white shadow-lg'
                : 'glass text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="font-bold text-sm">{label}</span>
            <span className="text-[9px] opacity-60 mt-0.5">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
