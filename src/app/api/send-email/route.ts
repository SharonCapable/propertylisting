import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { bookingId, type } = await req.json();

    if (!bookingId || !type) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        properties (*)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking || !booking.properties) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    let emailSubject = '';
    let emailHtml = '';

    if (type === 'confirmation') {
      emailSubject = `Booking Confirmation - ${booking.properties.title}`;
      emailHtml = generateConfirmationEmail(booking);
    } else if (type === 'visa_invitation' && booking.needs_invitation) {
      emailSubject = `Visa Invitation Letter - ${booking.properties.title}`;
      emailHtml = generateVisaInvitationEmail(booking);
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    const { data, error: emailError } = await resend.emails.send({
      from: 'CirclePoint Homes <noreply@circlepointhomes.com>',
      to: [booking.guest_email],
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateConfirmationEmail(booking: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Booking Confirmation</h1>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2>Guest Details</h2>
        <p><strong>Name:</strong> ${booking.guest_name}</p>
        <p><strong>Email:</strong> ${booking.guest_email}</p>
        <p><strong>Phone:</strong> ${booking.guest_phone}</p>
      </div>

      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2>Booking Details</h2>
        <p><strong>Property:</strong> ${booking.properties.title}</p>
        <p><strong>Location:</strong> ${booking.properties.location}</p>
        <p><strong>Check-in:</strong> ${new Date(booking.check_in).toLocaleDateString()}</p>
        <p><strong>Check-out:</strong> ${new Date(booking.check_out).toLocaleDateString()}</p>
        <p><strong>Total Price:</strong> $${booking.total_price}</p>
      </div>

      ${booking.needs_invitation ? `
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404;">Visa Invitation Letter</h3>
          <p>A visa invitation letter will be prepared and sent to you separately within 24 hours.</p>
        </div>
      ` : ''}

      <p>Thank you for choosing CirclePoint Homes!</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
    </div>
  `;
}

function generateVisaInvitationEmail(booking: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Visa Invitation Letter</h1>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2>INVITATION LETTER FOR VISA APPLICATION</h2>
        
        <p>To Whom It May Concern,</p>
        
        <p>This letter serves as an official invitation for <strong>${booking.guest_name}</strong> 
        (Passport Number: ${booking.passport_number}, issued by ${booking.passport_country}) 
        to visit our property for accommodation purposes.</p>
        
        <h3>Accommodation Details:</h3>
        <p><strong>Property:</strong> ${booking.properties.title}</p>
        <p><strong>Address:</strong> ${booking.properties.location}</p>
        <p><strong>Check-in Date:</strong> ${new Date(booking.check_in).toLocaleDateString()}</p>
        <p><strong>Check-out Date:</strong> ${new Date(booking.check_out).toLocaleDateString()}</p>
        <p><strong>Duration of Stay:</strong> ${Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 3600 * 24))} days</p>
        
        <p>The guest has made a confirmed reservation with us and all accommodation 
        expenses have been arranged. We guarantee that the guest will be provided 
        with proper accommodation during their stay.</p>
        
        <p>Should you require any additional information, please do not hesitate to contact us.</p>
        
        <p>Sincerely,<br>
        CirclePoint Homes Management<br>
        Email: support@circlepointhomes.com</p>
      </div>
      
      <p><em>Please print this letter and present it with your visa application.</em></p>
    </div>
  `;
}
