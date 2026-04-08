'use client'

import { differenceInYears, parseISO, format } from 'date-fns'
import { Modal } from '@/components/ui/Modal'
import type { Person } from '@/types/person'

interface ViewPersonModalProps {
  person: Person | null
  onClose: () => void
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  )
}

export function ViewPersonModal({ person, onClose }: ViewPersonModalProps) {
  if (!person) return null

  const age = differenceInYears(new Date(), parseISO(person.birthDate))
  const formattedBirthDate = format(parseISO(person.birthDate), 'dd/MM/yyyy')

  return (
    <Modal open={person !== null} onClose={onClose} title="ข้อมูลบุคคล">
      {/* Name banner */}
      <div className="mb-5 flex items-center gap-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20 px-4 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-lg font-bold text-indigo-300">
          {person.firstName[0]}
        </div>
        <div>
          <p className="text-base font-semibold text-white">{person.firstName} {person.lastName}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label="วันเกิด" value={formattedBirthDate} />
        <Field label="อายุ" value={`${age} ปี`} />
        <Field label="บ้านเลขที่" value={person.houseNumber} />
        <Field label="ถนน" value={person.street ?? '-'} />
        <Field label="ตำบล/แขวง" value={person.subDistrict} />
        <Field label="อำเภอ/เขต" value={person.district} />
        <Field label="จังหวัด" value={person.province} />
        <Field label="รหัสไปรษณีย์" value={person.postalCode} />
      </div>

      <div className="mt-6 flex justify-end border-t border-slate-800 pt-5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-600"
        >
          ปิด
        </button>
      </div>
    </Modal>
  )
}
