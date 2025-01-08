const functions = require('firebase-functions')
const { getFirestore } = require('firebase-admin/firestore')
const { DateTime } = require('luxon')
const { parseExpression } = require('cron-parser')
const db = getFirestore('tokyo-db')
const { getRandomID, getPeriodFromCrontab } = require('./utils.js')
const TaskSchema = require('./Schemas/TaskSchema.js')
const Joi = require('joi')

const handleTemplate = async (template) => {
    try {
        if (!template.crontab || template.crontab === '0 0 0 * *' || template.crontab === "0 0 * * 0" || template.crontab === "0 0 0 0 *") return;

        const db = getFirestore('tokyo-db')
        const batch = db.batch()
        const offset = getPeriodFromCrontab(template.crontab) === 'yearly' ? { years: 1 } : { months: 1 }
        const startDate = DateTime.fromISO(`${template.lastGeneratedTask}T${template.startTime || '00:00'}:00`, { zone: template.timeZone }).plus({ days: 1 })
        const endDate = DateTime.now().setZone(template.timeZone).plus(offset)

        if (startDate >= endDate) return

        const tasksArray = await buildFutureTasks({ 
            template, 
            startDateJS: new Date(startDate), 
            endDateJS: new Date(endDate) 
        })

        tasksArray.forEach(task => {
            const taskID = getRandomID()
            const documentPath = `users/${template.userID}/tasks/${taskID}`
            const taskRef = db.doc(documentPath)
            batch.set(taskRef, task)
        });
        await batch.commit()
        functions.logger.log('Tasks generated for template:', template.name, "through", endDate.toFormat('yyyy-MM-dd'))
        return
    } catch (error) {
        console.log('Error in handleTemplate:', error)
    }
}

const buildFutureTasks = async ({template, startDateJS, endDateJS}) => {
    const interval = parseExpression(template.crontab, ({ currentDate: startDateJS, endDate: endDateJS, iterator: true }));
    const generatedTemplates = [];
    while (true) { // I also smoke and do drugs
        const cronObj = interval.next();
        const ISODate = DateTime.fromJSDate(new Date(cronObj.value.toString())).toFormat('yyyy-MM-dd')
        const newTask = {
            name: template.name,
            startDateISO: ISODate,
            iconURL: template.iconURL,
            tags: template.tags,
            templateID: template.id,
            timeZone: template.timeZone,
            notes: template.notes,
            notify: template.notify,
            isDone: false,
            imageDownloadURL: "",
            imageFullPath: "",
            duration: template.duration,
            parentID: "",
            orderValue: 0,
            startTime: template.startTime,
        }
        Joi.attempt(newTask, TaskSchema);
        generatedTemplates.push(newTask);
        if (cronObj.done) {
            const documentPath = `users/${template.userID}/templates/${template.id}`;
            const templateRef = db.doc(documentPath);
            templateRef.update({ lastGeneratedTask: ISODate })
            break;
        }
    }
    return generatedTasks;
};


exports.handleTemplate = handleTemplate;