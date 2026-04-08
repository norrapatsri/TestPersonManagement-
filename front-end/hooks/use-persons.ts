'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPersons, createPerson } from '@/services/person-service'
import { useToast } from '@/components/ui/Toast'
import type { CreatePersonInput } from '@/types/person'

export function usePersons() {
  return useQuery({
    queryKey: ['persons'],
    queryFn: () => getPersons(),
  })
}

export function useCreatePerson() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: (data: CreatePersonInput) => createPerson(data),
    onSuccess: () => {
      showToast('บันทึกข้อมูลสำเร็จ', 'success')
      void queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
    onError: (error: Error) => {
      showToast(error.message, 'error')
    },
  })
}
