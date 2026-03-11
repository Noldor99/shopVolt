'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'

import FormInput from '@/components/form/FormInput'
import { SelectForm } from '@/components/form/FormSelect'
import { Button } from '@/components/ui/button'

type FormProductItemsProps = {
  name: 'items'
}

const sizeSelectItems = [
  { value: '20', label: '20 cm' },
  { value: '30', label: '30 cm' },
  { value: '40', label: '40 cm' },
]

const pizzaTypeSelectItems = [
  { value: '1', label: 'Thin' },
  { value: '2', label: 'Traditional' },
]

export const FormProductItems = ({ name }: FormProductItemsProps) => {
  const form = useFormContext()
  const { control } = form

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  })

  return (
    <div className="space-y-3 ">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-black">Items</p>
        <Button
          type="button"
          variant="black_out"
          size="sm"
          onClick={() => append({ price: undefined, size: undefined, pizzaType: undefined })}
        >
          Add item
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
          No items yet. Click &quot;Add item&quot; to create one.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {fields.map((field, index) => (
          <div key={field.id} className="paper-dark space-y-4 p-[10px] paper-sharp">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Item {index + 1}</p>
            <div className="grid grid-cols-1 gap-4">
              <FormInput
                name={`items.${index}.price`}
                type="number"
                placeholder="Price"
                min={0}
                step={1}
              />
              <SelectForm
                name={`items.${index}.size`}
                placeholder="Size (optional)"
                selectItems={sizeSelectItems}
              />
              <SelectForm
                name={`items.${index}.pizzaType`}
                placeholder="Pizza type (optional)"
                selectItems={pizzaTypeSelectItems}
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="destructive_out" size="sm" onClick={() => remove(index)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
