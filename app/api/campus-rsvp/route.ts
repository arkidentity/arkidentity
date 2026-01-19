import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, gatherings, bringing, message } = body;

    // Validate required fields
    if (!name || !phone || !email || !gatherings || gatherings.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if Resend is configured
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Send email via Resend
    await resend.emails.send({
      from: 'ARK Identity <iowa@arkidentity.com>',
      to: 'iowa@arkidentity.com',
      subject: `New Campus RSVP - ${name}`,
      html: `
        <h2>New Campus Ministry RSVP</h2>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>

        <p><strong>Interested in:</strong></p>
        <ul>
          ${gatherings.map((g: string) => `<li>${g}</li>`).join('')}
        </ul>

        <p><strong>Bringing:</strong> ${bringing || 'None listed'}</p>

        <p><strong>Message:</strong> ${message || 'None'}</p>

        <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-US', {
          timeZone: 'America/Chicago',
          dateStyle: 'full',
          timeStyle: 'long'
        })}</p>
      `,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Campus RSVP error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
