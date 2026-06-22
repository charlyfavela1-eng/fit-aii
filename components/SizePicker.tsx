'use client'

import { PersonSize } from '@/lib/catalog'

const sizes: PersonSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

interface SizePickerProps {
  value: PersonSize | null
  onChange: (s: PersonSize) => void
}

export default function SizePicker({ value, onChange }: SizePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-gray-400">¿Cuál es tu talla?</p>
      <div className="flex gap-2 flex-wrap">
        {sizes.map(s => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`w-12 h-12 rounded-xl font-bold text-sm transition ${
              value === s
                ? 'bg-sky-600 text-white ring-2 ring-sky-400'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
