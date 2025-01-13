/**
 * NOTE: This might need to be a svelte store, not a .js file
 * 
 * Given calEarliestHHMM and calLatestHHMM returns:
 * 1. The timestamps
 * 2. The number of minutes between calEarliestHHMM and calLatestHHMM (to determine the height of columns etc.)
 */
const minutesDiff = getMinutesDiff({ calEarliestHHMM: '07:15', calLatestHHMM: '23:15' })

// given calEarliestHHMM and calLatestHHMM, generate the invisible rectangles
export function getTimestamps({ calEarliestHHMM, calLatestHHMM }) {
  const timestamps = [];
  
  const [startHour, startMinute] = calEarliestHHMM.split(':').map(Number);
  const [endHour, endMinute] = calLatestHHMM.split(':').map(Number);
  
  // Add initial timestamp if it's not on the hour
  if (startMinute !== 0) {
    timestamps.push(calEarliestHHMM);
  }
  
  // Add hourly timestamps
  let currentHour = startMinute > 0 ? startHour + 1 : startHour;
  while (currentHour <= endHour) {
    const timestamp = `${currentHour.toString().padStart(2, '0')}:00`;
    timestamps.push(timestamp);
    currentHour++;
  }
  
  // Add final timestamp if it's not on the hour
  if (endMinute !== 0) {
    timestamps.push(calLatestHHMM)
  }

  return timestamps
}

export function getMinutesDiff({ calEarliestHHMM, calLatestHHMM }) {
  const [startHour, startMinute] = calEarliestHHMM.split(':').map(Number)
  const [endHour, endMinute] = calLatestHHMM.split(':').map(Number)
  return (endHour - startHour) * 60 + (endMinute - startMinute)
}