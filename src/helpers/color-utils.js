import { themeColors } from '/src/store/colorGradient.js'

export const naturalGreen = 'hsl(98, 40%, 90%)'
export const offWhite = '#f8f9f9'
export const sunshineOrange = 'oklch(0.92 0.08 72.71)'

export function setCalendarTheme (theme = 'naturalGreen') {
  if (theme === 'sunshineOrange') {
    setSunshineOrangeTheme()
  } else if (theme === 'naturalGreen') {
    setNaturalGreenTheme()
  } else if (theme === 'offWhite') {
    setOffWhiteTheme()
  }
}

function setSunshineOrangeTheme () {
  themeColors.set({
    todoList: 'oklch(0.9 0.1 72.14)',
    calendar: sunshineOrange,
    navbar: 'oklch(0.93 0.07 72.54)'
  })
}

function setNaturalGreenTheme () {
  themeColors.set({
    todoList: 'hsl(100, 40%, 86%)', 
    calendar: naturalGreen,
    navbar: 'hsla(98, 30%, 94%)'
  })
}

function setOffWhiteTheme () {
  themeColors.set({
    todoList: offWhite,
    calendar: offWhite,
    navbar: offWhite
  })
}