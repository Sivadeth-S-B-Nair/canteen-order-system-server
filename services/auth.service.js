const bcrypt = require('bcryptjs')
const { User } = require('../models')

const findUserByEmail = async (email) => {
  return User.findOne({ where: { email } })
}

const findUserById=async(id)=>{
  return User.findByPk(id)
}

const createUser = async (name, email, password, role) => {
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, password: hashedPassword, role })

  // Never return password outside the service
  const { password: _p, ...safeUser } = user.toJSON()
  return safeUser
}

const validatePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword)
}

module.exports = { findUserByEmail, findUserById, createUser, validatePassword }