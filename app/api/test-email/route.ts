import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail } = await request.json();

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Configure SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify SMTP connection
    await transporter.verify();

    // Send test email
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipientEmail,
      subject: 'SMTP Test Email - Invoice Easy',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">SMTP Configuration Test</h2>
          <p>This is a test email to verify that your SMTP configuration is working correctly.</p>
          
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin-top: 0;">Configuration Details:</h3>
            <ul>
              <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
              <li><strong>SMTP Secure:</strong> ${process.env.SMTP_SECURE}</li>
              <li><strong>SMTP User:</strong> ${process.env.SMTP_USER}</li>
              <li><strong>From Address:</strong> ${process.env.SMTP_FROM || process.env.SMTP_USER}</li>
            </ul>
          </div>
          
          <p style="color: #059669; font-weight: bold;">✅ SMTP configuration is working correctly!</p>
          
          <p>If you received this email, your Invoice Easy application is ready to send invoices and receipts.</p>
          
          <hr style="margin: 32px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This test email was sent from your Invoice Easy application.<br>
            Timestamp: ${new Date().toISOString()}
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      preview: nodemailer.getTestMessageUrl(info),
      smtpConfig: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
      }
    });

  } catch (error: any) {
    console.error('SMTP Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: error.message,
      smtpConfig: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
      }
    }, { status: 500 });
  }
}