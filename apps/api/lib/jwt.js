const jwt = require('jsonwebtoken')

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' })
}

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production'

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'none',
    domain: isProduction ? '.r-hub.xyz' : undefined,
  }

  res.cookie('access_token', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000
  })

  res.cookie('refresh_token', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
}

const clearTokenCookies = (res) => {
  res.clearCookie('access_token')
  res.clearCookie('refresh_token')
}

module.exports = { generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies }
