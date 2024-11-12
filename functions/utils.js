function getRandomID() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let autoId = '';
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
}

const getPeriodFromCrontab = (crontab) => {
  if (crontab === '') return 'quick';
  const parts = crontab.split(' ');
  if (parts.length !== 5) throw new Error('Invalid crontab format', crontab, parts);
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  if (dayOfMonth !== '*' && month !== '*' && dayOfWeek === '*') return 'yearly';
  if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') return 'monthly';
  if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') return 'weekly';
  throw new Error('unknown frequency');
}

exports.getRandomID = getRandomID;
exports.getPeriodFromCrontab = getPeriodFromCrontab;