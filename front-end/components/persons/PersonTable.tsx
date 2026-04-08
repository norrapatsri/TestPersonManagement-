'use client'

import { useState } from 'react'
import { differenceInYears, parseISO, format } from 'date-fns'
import { usePersons } from '@/hooks/use-persons'
import { AddPersonModal } from './AddPersonModal'
import { ViewPersonModal } from './ViewPersonModal'
import type { Person } from '@/types/person'

function formatAddress(person: Person): string {
  const street = person.street ? ` ${person.street}` : ''
  return `${person.houseNumber}${street} ต.${person.subDistrict} อ.${person.district} จ.${person.province} ${person.postalCode}`
}

export function PersonTable() {
  const { data, isLoading, isError } = usePersons()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)

  const persons = data ?? []
  const totalItems = persons.length

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">รายการข้อมูลบุคคล</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalItems > 0 ? `${totalItems} รายการ` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มข้อมูล
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-widest text-slate-400">
                ชื่อ-นามสกุล
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-widest text-slate-400">
                ที่อยู่
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-widest text-slate-400">
                วันเกิด
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-widest text-slate-400">
                อายุ
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-medium uppercase tracking-widest text-slate-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    กำลังโหลด...
                  </div>
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-red-400">
                  เกิดข้อผิดพลาด ไม่สามารถโหลดข้อมูลได้
                </td>
              </tr>
            )}
            {!isLoading && !isError && persons.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">ยังไม่มีข้อมูลบุคคล</span>
                    <span className="text-xs text-slate-600">กดปุ่ม "เพิ่มข้อมูล" เพื่อเริ่มต้น</span>
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && persons.map((person) => {
              const age = differenceInYears(new Date(), parseISO(person.birthDate))
              const formattedBirthDate = format(parseISO(person.birthDate), 'dd/MM/yyyy')
              return (
                <tr key={person.id} className="group hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-semibold text-indigo-400">
                        {person.firstName[0]}
                      </div>
                      <span className="text-sm font-medium text-white">
                        {person.firstName} {person.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <span className="text-sm text-slate-400 line-clamp-1">
                      {formatAddress(person)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-400">
                    {formattedBirthDate}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                      {age} ปี
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedPerson(person)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      ดูข้อมูล
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AddPersonModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <ViewPersonModal
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
      />
    </div>
  )
}
