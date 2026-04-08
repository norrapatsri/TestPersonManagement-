import { fetchJson } from './api'
import type { Person, CreatePersonInput } from '@/types/person'

export const getPersons = (): Promise<Person[]> =>
  fetchJson<Person[]>('/api/persons')

export const getPersonById = (id: number): Promise<Person> =>
  fetchJson<Person>(`/api/persons/${id}`)

export const createPerson = (data: CreatePersonInput): Promise<Person> =>
  fetchJson<Person>('/api/persons', {
    method: 'POST',
    body: JSON.stringify(data),
  })
