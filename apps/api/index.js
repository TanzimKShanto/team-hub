const express = require('express')
const app = express()

app.get('/', (req, res) => res.json({ status: 'ok' }))

const port = process.env.PORT || 4000;

app.listen(port, () => console.log('API running on port 4000'))
