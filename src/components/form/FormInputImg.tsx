'use client'

import { shortenText } from '@/utils/shortenText'

import Link from 'next/link'

import React, { FC, useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useFormContext } from 'react-hook-form'

import { IconUpload } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

interface FormImageProps {
  imgPreview?: string
  name: string
}

const FormInputImg: FC<FormImageProps> = ({ imgPreview, name }: FormImageProps) => {
  const [fileName, setFileName] = useState<string | undefined>(undefined)

  const form = useFormContext()

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      form.setValue(name, file, {
        shouldValidate: true,
        shouldDirty: true,
      })
      setFileName(file.name)
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
      <div className="flex h-[56px] w-full items-center justify-between border border-black bg-white px-[16px]">
        <div className="flex flex-1 items-center justify-between">
          {!fileName && !imgPreview && <p className={cn('text-sm font-medium')}>Upload photo</p>}
          {fileName && <p className={cn('text-sm font-medium')}>{shortenText(fileName, 60)}</p>}
          {imgPreview && !fileName && (
            <Link href={imgPreview} target="_blank" className={cn('text-sm font-medium')}>
              View Img
            </Link>
          )}
          {!isDragActive && (
            <Button {...getRootProps({})} variant="ghost" type="button">
              <input {...getInputProps()} />
              <IconUpload />
            </Button>
          )}
        </div>
      </div>
      <div>
        {form.formState.errors?.[name] && (
          <p className={cn('text-sm font-medium text-destructive')}>
            {form.formState?.errors?.[name]?.message as keyof typeof form.formState.errors}
          </p>
        )}
      </div>
    </>
  )
}

export default FormInputImg
