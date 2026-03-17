'use client'

import { ChangeEvent, FC } from 'react'
import { useFormContext } from 'react-hook-form'

import { Button } from '@/components/ui/button'

interface FormImagePickerProps {
  name: string
  mainImageName: string
}

export const FormImageList: FC<FormImagePickerProps> = ({ name, mainImageName }) => {
  const { control, setValue, watch, formState } = useFormContext()

  const imageUrls: string[] = watch(name) ?? []

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })

  const handleAddImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    const encodedImages = await Promise.all(files.map((file) => toBase64(file)))
    const nextImages = [...imageUrls, ...encodedImages]

    setValue(name, nextImages, { shouldDirty: true, shouldValidate: true })
    if (!watch(mainImageName)) {
      setValue(mainImageName, nextImages[0], { shouldDirty: true, shouldValidate: true })
    }
    event.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    const nextImages = imageUrls.filter((_, i) => i !== index)
    setValue(name, nextImages, { shouldDirty: true, shouldValidate: true })
    setValue(mainImageName, nextImages[0] ?? '', { shouldDirty: true, shouldValidate: true })
  }

  const handleSetMainImage = (index: number) => {
    if (index === 0) return
    const nextImages = [...imageUrls]
    const [selectedImage] = nextImages.splice(index, 1)
    nextImages.unshift(selectedImage)

    setValue(name, nextImages, { shouldDirty: true, shouldValidate: true })
    setValue(mainImageName, nextImages[0], { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="space-y-4">
      <input type="hidden" {...control.register(mainImageName)} />

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Зображення пристрою</p>
            <p className="text-xs text-slate-500">Перше зображення буде головним</p>
          </div>

          <label className="inline-flex cursor-pointer items-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 active:scale-95">
            Завантажити
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleAddImages}
            />
          </label>
        </div>

        {imageUrls.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {imageUrls.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              >
                <img
                  src={image}
                  alt="Preview"
                  className="h-36 w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="flex items-center justify-between gap-2 bg-white/90 p-2 backdrop-blur-sm">
                  <Button
                    type="button"
                    variant={index === 0 ? 'black' : 'default_out'}
                    className="h-7 text-[13px]"
                    onClick={() => handleSetMainImage(index)}
                    disabled={index === 0}
                  >
                    {index === 0 ? 'Main image' : 'Set as main'}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive_out"
                    className="h-7 text-[13px]"
                    onClick={() => handleRemoveImage(index)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-10">
            <p className="text-sm text-slate-500">Додайте хоча б одне зображення</p>
          </div>
        )}

        <div className="space-y-1">
          {formState.errors[mainImageName] && (
            <p className="text-xs text-destructive">
              {formState.errors[mainImageName]?.message as string}
            </p>
          )}
          {formState.errors[name] && (
            <p className="text-xs text-destructive">{formState.errors[name]?.message as string}</p>
          )}
        </div>
      </div>
    </div>
  )
}
