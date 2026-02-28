const authService = require('../../services/authService')

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body)
    res.status(201).json({ user })
  } catch (error) {
    next(error)
  }
}

async function login(req, res, next) {
  try {
    const authResponse = await authService.login(req.body)
    res.status(200).json(authResponse)
  } catch (error) {
    next(error)
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout()
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  login,
  logout
}
