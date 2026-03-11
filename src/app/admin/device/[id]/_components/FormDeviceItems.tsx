'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'

import FormInput from '@/components/form/FormInput'
import { Button } from '@/components/ui/button'

type FormDeviceItemsProps = {
  name: 'info'
}

export const FormDeviceItems = ({ name }: FormDeviceItemsProps) => {
  const form = useFormContext()
  const { control } = form

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-black">Device info</p>
        <Button
          type="button"
          variant="black_out"
          size="sm"
          onClick={() => append({ key: '', value: '' })}
        >
          Add info row
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
          No info yet. Click Add info row to create one.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {fields.map((field, index) => (
          <div key={field.id} className="paper-dark paper-sharp space-y-4 p-[10px]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Info {index + 1}
            </p>
            <div className="grid grid-cols-1 gap-4">
              <FormInput name={`info.${index}.key`} placeholder="Key (e.g. RAM)" />
              <FormInput name={`info.${index}.value`} placeholder="Value (e.g. 8 GB)" />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive_out"
                size="sm"
                onClick={() => remove(index)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
