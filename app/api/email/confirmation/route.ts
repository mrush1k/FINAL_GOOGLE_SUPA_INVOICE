import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { email, displayName, appName } = await request.json()

    // Check if SMTP is configured
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.warn('SMTP not configured - skipping confirmation email')
      return NextResponse.json({ 
        success: true, 
        message: 'Account created successfully (email not configured)' 
      })
    }

    // Get base URL for login link
    const baseUrl = 'https://final-google-supa-invoice.vercel.app'
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    // Email content
    const subject = `Welcome to ${appName || 'Invoice Easy'} – Your Account is Ready!`
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${appName || 'Invoice Easy'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #6c757d; font-size: 14px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background: #0056b3; }
          h1 { color: #2c3e50; margin: 0; }
          h2 { color: #34495e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${appName || 'Invoice Easy'}!</h1>
          </div>
          <div class="content">
            <h2>Hi ${displayName}! 👋</h2>
            <p>Congratulations! Your account has been successfully created and is ready to use.</p>
            <p>You can now start managing your invoices, customers, and payments with our professional invoice management system.</p>
            <div style="text-align: center;">
              <a href="${baseUrl}/login" class="button">Log In to Your Account</a>
            </div>
            <p>If you have any questions or need assistance getting started, don't hesitate to reach out to our support team.</p>
            <p>Welcome aboard!</p>
            <p>Best regards,<br>The ${appName || 'Invoice Easy'} Team</p>
          </div>
          <div class="footer">
            <p>© 2024 ${appName || 'Invoice Easy'}. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
      Welcome to ${appName || 'Invoice Easy'}!
      
      Hi ${displayName}!
      
      Congratulations! Your account has been successfully created and is ready to use.
      
      You can now start managing your invoices, customers, and payments with our professional invoice management system.
      
      Log in to your account: ${baseUrl}/login
      
      If you have any questions or need assistance getting started, don't hesitate to reach out to our support team.
      
      Welcome aboard!
      
      Best regards,
      The ${appName || 'Invoice Easy'} Team
      
      © 2024 ${appName || 'Invoice Easy'}. All rights reserved.
      This email was sent to ${email}
    `

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || smtpUser,
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Confirmation email sent successfully' 
    })

  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send confirmation email' 
      },
      { status: 500 }
    )
  }
}