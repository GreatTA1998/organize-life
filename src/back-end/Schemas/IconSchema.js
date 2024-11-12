import Joi from "joi";

const IconSchema = Joi.object({
    url: Joi.string().required(),
    name: Joi.string().required(),
    isShareable: Joi.boolean().required(),
    createdBy: Joi.string().required(),
    tags: Joi.string().required().allow(""),
})

export default IconSchema;