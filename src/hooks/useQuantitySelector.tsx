import { useState } from "react"

export const useQuantitySelector = (initialValue: number = 1, max: number = 99) => {
  const [quantity, setQuantity] = useState<number>(initialValue)

  const handleDecrease = () => {
    setQuantity((q) => (q > 1 ? q - 1 : 1))
  }

  const handleIncrease = () => {
    setQuantity((q) => (q < max ? q + 1 : q))
  }

  const handleChangeInput = (value: string) => {
    // Видаляємо все, крім цифр
    const num = Number(value.replace(/[^\d]/g, ""))

    if (!num || num < 1) {
      setQuantity(1)
    } else if (num > max) {
      setQuantity(max)
    } else {
      setQuantity(num)
    }
  }

  return {
    quantity,
    setQuantity,
    handleDecrease,
    handleIncrease,
    handleChangeInput,
  }
}
