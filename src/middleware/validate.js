const validate = validator => async (req, res, next) => {

  const { error } = await validator(req.body)

  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }

  next()
}

module.exports = validate
