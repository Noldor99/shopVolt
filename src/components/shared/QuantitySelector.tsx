"use client"

type QuantitySelectorProps = {
  value: number
  onDecrease: () => void
  onIncrease: () => void
  onChangeInput: (value: string) => void
}

export const QuantitySelector = ({
  value,
  onDecrease,
  onIncrease,
  onChangeInput,
}: QuantitySelectorProps) => {
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1">
      <button
        type="button"
        onClick={onDecrease}
        className="h-8 w-8 rounded-full text-lg leading-none text-slate-700 hover:bg-slate-100"
      >
        -
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeInput(e.target.value)}
        className="w-10 border-none bg-transparent text-center text-sm font-medium text-slate-900 outline-none"
      />
      <button
        type="button"
        onClick={onIncrease}
        className="h-8 w-8 rounded-full text-lg leading-none text-slate-700 hover:bg-slate-100"
      >
        +
      </button>
    </div>
  )
}

