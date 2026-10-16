const jwt = require('jsonwebtoken')

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' })
}

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

const isProduction = process.env.NODE_ENV === 'production'

// Frontend and API share one registrable domain (e.g. frontend.r-hub.xyz and
// api.r-hub.xyz), so cookies are same-site. `lax` is more reliable than `none`,
// which browsers increasingly reject as third-party.
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  domain: isProduction ? (process.env.COOKIE_DOMAIN || '.r-hub.xyz') : undefined
}

const setTokenCookies = (res, accessToken, refreshToken) => {
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
  res.clearCookie('access_token', cookieOptions)
  res.clearCookie('refresh_token', cookieOptions)
}

module.exports = { generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies }
