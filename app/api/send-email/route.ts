// app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface EmailRequestBody {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  to?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequestBody = await request.json();

    const { name, email, phone, subject, message, to } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create transporter - configure with your email service
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (error) {
      console.error('SMTP configuration error:', error);
      return NextResponse.json(
        { error: 'Email service configuration error' },
        { status: 500 }
      );
    }

    const emailSubject = subject || `Contact Form Message from ${name}`;
    const recipientEmail = to || process.env.CONTACT_EMAIL || process.env.SMTP_USER;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'No recipient email configured' },
        { status: 500 }
      );
    }

    // Email content
    const mailOptions = {
      from: process.env.SMTP_FROM || `"Website Contact" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      replyTo: email, 
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nova poruka</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
                    Nova poruka
                </h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #1f2937; margin-top: 0; font-size: 18px; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
                        Informacije o kontaktu
                    </h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280; width: 80px;"><strong>Ime:</strong></td>
                            <td style="padding: 8px 0; color: #1f2937;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
                            <td style="padding: 8px 0; color: #1f2937;">
                                <a href="mailto:${email}" style="color: #4f46e5; text-decoration: none;">${email}</a>
                            </td>
                        </tr>
                        ${phone ? `
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280;"><strong>Telefon:</strong></td>
                            <td style="padding: 8px 0; color: #1f2937;">
                                <a href="tel:${phone}" style="color: #4f46e5; text-decoration: none;">${phone}</a>
                            </td>
                        </tr>
                        ` : ''}
                        ${subject ? `
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280;"><strong>Tema:</strong></td>
                            <td style="padding: 8px 0; color: #1f2937;">${subject}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>

                <div style="background: #f0f9ff; padding: 25px; border-radius: 8px; border-left: 4px solid #4f46e5;">
                    <h2 style="color: #1f2937; margin-top: 0; font-size: 18px;">
                        Poruka
                    </h2>
                    <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 10px;">
                        <p style="margin: 0; line-height: 1.6; color: #374151; white-space: pre-line;">${message}</p>
                    </div>
                </div>

                <div style="margin-top: 25px; padding: 15px; background: #f3f4f6; border-radius: 6px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        Poruka poslana sa Deliver4Me ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}.
                    </p>
                </div>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                <p>Powered by Deliver4Me • ${new Date().getFullYear()}</p>
            </div>
        </body>
        </html>
      `,
      text: `
NOVA PORUKA
===========================

INFORMACIJE
-------------------
Ime: ${name}
Email: ${email}
${phone ? `Telefon: ${phone}` : ''}
${subject ? `Tema: ${subject}` : ''}

PORUKA
-------
${message}

---
 Poruka poslana sa Deliver4Me ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}.
      `.trim(),
    };

    const result = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', {
      messageId: result.messageId,
      to: recipientEmail,
      subject: emailSubject,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Email poslan',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send email',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'endpoint is active',
    timestamp: new Date().toISOString()
  });
}