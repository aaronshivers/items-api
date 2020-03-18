const Joi = require('@hapi/joi')

const userValidator = async user => {
  const regex = /((?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W)).{8,100}/

  const schema = Joi.object({
    email:
      Joi
        .string()
        .min(5)
        .max(100)
        .email({ minDomainSegments: 1 })
        .required(),
    password:
      Joi
        .string()
        .regex(regex)
        .required()
  })

  return schema.validate(user)
}

module.exports = userValidator
