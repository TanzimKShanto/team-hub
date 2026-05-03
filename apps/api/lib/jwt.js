const jwt = require('jsonwebtoken')

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' })
}

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 15 * 60 * 1000  // 15 min
  })
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  })
}

const clearTokenCookies = (res) => {
  res.clearCookie('access_token')
  res.clearCookie('refresh_token')
}

module.exports = { generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies }
