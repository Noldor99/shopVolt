'use client'

import React, { FC, ReactElement, useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useFormContext } from 'react-hook-form'

import { IconTrash } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

import { fileToBase64 } from '@/lib/fileToBase64'
import { cn } from '@/lib/utils'

interface FormImageProps {
  name: string
  textButton: string
  imgRender: ReactElement
}

const FormDropImg: FC<FormImageProps> = ({ name, textButton, imgRender }: FormImageProps) => {
  const form = useFormContext()
  const { watch } = form

  const [imagePreview, setImagePreview] = useState<string | undefined>()
  const [imgExist, setImgExist] = useState<string | undefined>()

  useEffect(() => {
    setImgExist(watch(name) ?? '')
    setImagePreview(watch(name) ?? '')
  }, [])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      form.setValue(name, acceptedFiles[0], {
        shouldValidate: true,
        shouldDirty: true,
      })
      fileToBase64(acceptedFiles[0], setImagePreview)
    },
    [form]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/heic': [],
      'image/jfif': [],
      'image/gif': [],
      'image/svg+xml': [],
      'image/bmp': [],
      'image/tiff': [],
    },
  })

  return (
    <>
      <div className="border-grey-200 h-full w-full border">
        {imagePreview ? (
          <div className="relative flex h-full w-full items-center justify-center">
            <Button
              className="absolute bottom-2 right-2 z-50"
              variant={'destructive'}
              size={'sm'}
              type="button"
              onClick={() => {
                setImagePreview(undefined)
                form.setValue(name, '', {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }}
            >
              <IconTrash className="mr-2" />
              Delete
            </Button>
            {imgExist === imagePreview
              ? React.cloneElement(imgRender, {
                  imgData: { [name]: imagePreview },
                })
              : React.cloneElement(imgRender, { forForm: imagePreview })}
            {}
          </div>
        ) : (
          <>
            <div {...getRootProps({})} className="flex h-full w-full items-center justify-center">
              <input {...getInputProps()} />
              {React.cloneElement(imgRender, { forForm: imagePreview })}
              {!isDragActive && (
                <Button
                  size={'sm'}
                  type="button"
                  variant="black_out"
                  className="absolute bg-white p-4"
                >
                  {textButton}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      <div className="mb-[10px]">
        {form.formState.errors?.[name] && (
          <p className={cn('text-sm font-medium text-destructive')}>
            {form.formState?.errors?.[name]?.message as keyof typeof form.formState.errors}
          </p>
        )}
      </div>
    </>
  )
}

export default FormDropImg
