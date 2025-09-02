/**
 * @file Initializes and runs the HTTP server for the Telegram bot webhook.
 */

import http from 'http'
import { bot, secretPath } from './bot'

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

// Create and configure the HTTP server
export const server = http.createServer((req, res) => {
  console.log(`[SERVER] Incoming request: ${req.method} ${req.url}`); // Diagnostic log

  if (req.method === 'POST') { // Temporarily removed URL check for debugging
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const update = JSON.parse(body)
        bot.processUpdate(update)
        res.writeHead(200).end('ok')
      } catch (e) {
        console.error('Error processing update:', e)
        res.writeHead(500).end('error')
      }
    })
  } else {
    res.writeHead(404).end('not found')
  }
})

// Start listening
server.listen(port, '0.0.0.0', () => {
  console.log(`Server is listening on port ${port}`)
})
