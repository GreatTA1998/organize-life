import Joi from "joi";

export default Joi.object({
    name: Joi.string().required(),
    orderValue: Joi.number().required(),
    lastGeneratedTask: Joi.string().required(),
    crontab: Joi.string().required().allow(""),
    iconURL: Joi.string().required().allow(""),
    tags: Joi.string().required().allow(""),
    timeZone: Joi.string().required().allow(""),
    notes: Joi.string().required().allow(""),
    notify: Joi.string().required().allow(""),
    duration: Joi.number().required(),
    startTime: Joi.string().required().allow(""),
    // id: hydrated
    // userID: hydrated
})
// use Joi.attempt(object, Schema)

