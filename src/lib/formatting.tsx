import { format, isValid } from "date-fns"
import { es } from "date-fns/locale"

// Helper to format date strings in a readable way
export const formatDateString = (dateInput: string | Date | null | undefined) => {
  if (!dateInput) return null

  try {
    let date: Date
    
    if (typeof dateInput === 'string') {
      // Manejar cadenas de fecha ISO y formato YYYY-MM-DD
      if (dateInput.length === 10 && dateInput.includes("-")) {
        const [year, month, day] = dateInput.split("-").map(Number)
        date = new Date(year, month - 1, day)
      } else {
        date = new Date(dateInput)
      }
    } else if (dateInput instanceof Date) {
      date = dateInput
    } else {
      return null
    }

    if (!isValid(date)) return null

    // Verificar si tiene componente de tiempo
    const hasTime = date.getHours() > 0 || 
                    date.getMinutes() > 0 || 
                    date.getSeconds() > 0 || 
                    date.getMilliseconds() > 0

    return format(
      date, 
      hasTime ? "d 'de' MMMM yyyy, HH:mm" : "d 'de' MMMM yyyy", 
      { locale: es }
    )
  } catch (e) {
    console.error("Error formatting date:", e)
    return null
  }
}


// Helper function to format a date with time
export const formatDateTime = (date: Date | string | null) => {
  if (!date) return null
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (!isValid(dateObj)) return null
    
    return format(dateObj, "d 'de' MMMM yyyy, HH:mm", { locale: es })
  } catch (e) {
    console.error("Error formatting date time:", e)
    return null
  }
}

// Helper function to truncate text with ellipsis
export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}