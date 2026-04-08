'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { DatePicker } from '@/components/ui/DatePicker'
import { differenceInYears, parseISO, isValid } from 'date-fns'
import { useCreatePerson } from '@/hooks/use-persons'

const schema = z.object({
  firstName: z.string().min(1, 'กรุณากรอกชื่อ').max(100),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล').max(100),
  birthDate: z.string().min(1, 'กรุณาเลือกวันเกิด'),
  houseNumber: z.string().min(1, 'กรุณากรอกบ้านเลขที่').max(20),
  street: z.string().max(200).optional(),
  subDistrict: z.string().min(1, 'กรุณากรอกตำบล/แขวง').max(100),
  district: z.string().min(1, 'กรุณากรอกอำเภอ/เขต').max(100),
  province: z.string().min(1, 'กรุณากรอกจังหวัด').max(100),
  postalCode: z.string().length(5, 'รหัสไปรษณีย์ต้องมี 5 หลัก').regex(/^\d{5}$/, 'ต้องเป็นตัวเลขเท่านั้น'),
})

type FormValues = z.infer<typeof schema>

interface AddPersonModalProps {
  open: boolean
  onClose: () => void
}

function FormField({ label, error, required = false, children }: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
        {required && <span className="ml-1 text-indigo-400">*</span>}
      </label>
      {children}
      {error && (
        <span role="alert" className="text-xs text-red-400">
          {error}
        </span>
      )}
    </div>
  )
}

export function AddPersonModal({ open, onClose }: AddPersonModalProps) {
  const { mutate, isPending } = useCreatePerson()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormValues) => {
    mutate(data, {
      onSuccess: () => {
        reset()
        onClose()
      },
    })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const inputClass = 'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors'

  const birthDateValue = watch('birthDate')
  const parsedDate = birthDateValue ? parseISO(birthDateValue) : null
  const age = parsedDate && isValid(parsedDate) ? differenceInYears(new Date(), parsedDate) : null

  return (
    <Modal open={open} onClose={handleClose} title="เพิ่มข้อมูลบุคคล">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Row 1: ชื่อ + นามสกุล */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="ชื่อ" error={errors.firstName?.message} required>
            <input {...register('firstName')} type="text" className={inputClass} placeholder="ชื่อ" />
          </FormField>
          <FormField label="นามสกุล" error={errors.lastName?.message} required>
            <input {...register('lastName')} type="text" className={inputClass} placeholder="นามสกุล" />
          </FormField>
        </div>

        {/* Row 2: วันเกิด + อายุ */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <FormField label="วันเกิด" error={errors.birthDate?.message} required>
            <DatePicker
              value={birthDateValue ?? ''}
              onChange={(val) => setValue('birthDate', val, { shouldValidate: true })}
              hasError={!!errors.birthDate}
            />
          </FormField>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">อายุ</label>
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed">
              {age !== null ? <><span className="text-white font-medium">{age}</span>&nbsp;ปี</> : <span className="text-slate-600">—</span>}
            </div>
          </div>
        </div>

        {/* Row 4+: ที่อยู่ */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <FormField label="บ้านเลขที่" error={errors.houseNumber?.message} required>
            <input {...register('houseNumber')} type="text" className={inputClass} placeholder="บ้านเลขที่" />
          </FormField>

          <FormField label="ถนน" error={errors.street?.message}>
            <input {...register('street')} type="text" className={inputClass} placeholder="ถนน (ไม่บังคับ)" />
          </FormField>

          <FormField label="ตำบล/แขวง" error={errors.subDistrict?.message} required>
            <input {...register('subDistrict')} type="text" className={inputClass} placeholder="ตำบล/แขวง" />
          </FormField>

          <FormField label="อำเภอ/เขต" error={errors.district?.message} required>
            <input {...register('district')} type="text" className={inputClass} placeholder="อำเภอ/เขต" />
          </FormField>

          <FormField label="จังหวัด" error={errors.province?.message} required>
            <input {...register('province')} type="text" className={inputClass} placeholder="จังหวัด" />
          </FormField>

          <FormField label="รหัสไปรษณีย์" error={errors.postalCode?.message} required>
            <input {...register('postalCode')} type="text" className={inputClass} placeholder="00000" maxLength={5} />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isPending && (
              <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
