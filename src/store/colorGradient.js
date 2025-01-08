import { writable } from 'svelte/store'

export const themeColors = writable({
  todoList: '',
  calendar: '',
  navbar: ''
})