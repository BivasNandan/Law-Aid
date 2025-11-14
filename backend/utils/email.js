import nodemailer from 'nodemailer'

const createTransporter = () => {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  })
}

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter()
    if (!transporter) {
      console.warn('SMTP not configured - skipping email')
      return false
    }

    const from = process.env.FROM_EMAIL || process.env.SMTP_USER

    await transporter.sendMail({
      from,
      to,
      subject,
      text: text || undefined,
      html: html || undefined
    })

    return true
  } catch (err) {
    console.error('Failed to send email:', err)
    return false
  }
}

export default sendEmail
