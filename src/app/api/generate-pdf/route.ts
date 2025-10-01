import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('bookingId');
  const type = searchParams.get('type') || 'booking'; // 'booking' or 'visa'

  if (!bookingId) {
    return new NextResponse('Booking ID is required', { status: 400 });
  }

  if (!['booking', 'visa'].includes(type)) {
    return new NextResponse('Invalid PDF type. Must be "booking" or "visa"', { status: 400 });
  }

  try {
    // Fetch booking and property details from Supabase
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        properties (*)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking || !booking.properties) {
      throw new Error('Booking not found or failed to fetch details.');
    }

    // Check if visa invitation is requested but type is visa
    if (type === 'visa' && !booking.needs_invitation) {
      return new NextResponse('Visa invitation not requested for this booking', { status: 400 });
    }

    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    if (type === 'booking') {
      // Generate Booking Receipt PDF
      generateBookingReceiptPDF(doc, booking);
    } else if (type === 'visa') {
      // Generate Visa Invitation Letter PDF
      generateVisaInvitationPDF(doc, booking);
    }

    doc.end();

    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve());
    });

    const pdfData = Buffer.concat(buffers);
    const filename = type === 'booking'
      ? `booking-receipt-${bookingId}.pdf`
      : `visa-invitation-${bookingId}.pdf`;

    return new NextResponse(pdfData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return new NextResponse('Failed to generate PDF.', { status: 500 });
  }
}

function generateBookingReceiptPDF(doc: PDFKit.PDFDocument, booking: any) {
  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('CirclePoint Homes', { align: 'center' });
  doc.fontSize(18).text('Booking Receipt', { align: 'center' });
  doc.moveDown(2);

  // Booking Reference
  doc.fontSize(12).font('Helvetica').text(`Booking Reference: ${booking.id}`, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
  doc.moveDown();

  // Guest Details
  doc.fontSize(16).font('Helvetica-Bold').text('Guest Information');
  doc.fontSize(12).font('Helvetica')
    .text(`Name: ${booking.guest_name}`)
    .text(`Email: ${booking.guest_email}`)
    .text(`Phone: ${booking.guest_phone}`);
  doc.moveDown();

  // Property Details
  doc.fontSize(16).font('Helvetica-Bold').text('Property Details');
  doc.fontSize(12).font('Helvetica')
    .text(`Property: ${booking.properties.title}`)
    .text(`Location: ${booking.properties.location}`)
    .text(`Type: ${booking.properties.type}`)
    .text(`Guests: ${booking.properties.max_guests}`)
    .text(`Bedrooms: ${booking.properties.bedrooms}`)
    .text(`Bathrooms: ${booking.properties.bathrooms}`);
  doc.moveDown();

  // Booking Details
  doc.fontSize(16).font('Helvetica-Bold').text('Stay Details');
  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  
  doc.fontSize(12).font('Helvetica')
    .text(`Check-in: ${checkIn.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`)
    .text(`Check-out: ${checkOut.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`)
    .text(`Duration: ${nights} night${nights > 1 ? 's' : ''}`)
    .text(`Rate per night: $${booking.properties.price_per_night}`)
    .text(`Total Amount: $${booking.total_price}`, { underline: true });
  doc.moveDown();

  // Status
  doc.fontSize(16).font('Helvetica-Bold').text('Booking Status');
  doc.fontSize(12).font('Helvetica').fillColor('green')
    .text(`Status: ${booking.status.toUpperCase()}`, { underline: true });
  doc.fillColor('black').moveDown();

  // Footer
  doc.fontSize(10).font('Helvetica')
    .text('Thank you for choosing CirclePoint Homes!', { align: 'center' })
    .text('For any inquiries, please contact us at support@circlepointhomes.com', { align: 'center' });
}

function generateVisaInvitationPDF(doc: PDFKit.PDFDocument, booking: any) {
  const today = new Date();
  
  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('CirclePoint Homes', { align: 'center' });
  doc.fontSize(18).text('Visa Invitation Letter', { align: 'center' });
  doc.moveDown(2);

  // Date and Reference
  doc.fontSize(12).font('Helvetica')
    .text(`Date: ${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'right' })
    .text(`Reference: VIL-${booking.id}`, { align: 'right' });
  doc.moveDown(2);

  // Recipient
  doc.text('To Whom It May Concern:');
  doc.moveDown();

  // Main content
  doc.fontSize(12).font('Helvetica')
    .text(`We are pleased to invite ${booking.guest_name} to visit Ghana for tourism purposes. This letter serves as an official invitation for their visa application.`, { align: 'justify' });
  doc.moveDown();

  // Guest Details
  doc.fontSize(14).font('Helvetica-Bold').text('Guest Information:');
  doc.fontSize(12).font('Helvetica')
    .text(`Full Name: ${booking.guest_name}`)
    .text(`Email: ${booking.guest_email}`)
    .text(`Phone: ${booking.guest_phone}`)
    .text(`Passport Number: ${booking.passport_number}`)
    .text(`Passport Country: ${booking.passport_country}`)
    .text(`Passport Expiry: ${new Date(booking.passport_expiry!).toLocaleDateString()}`);
  doc.moveDown();

  // Accommodation Details
  doc.fontSize(14).font('Helvetica-Bold').text('Accommodation Details:');
  doc.fontSize(12).font('Helvetica')
    .text(`Property: ${booking.properties.title}`)
    .text(`Address: ${booking.properties.location}`)
    .text(`Check-in Date: ${new Date(booking.check_in).toLocaleDateString()}`)
    .text(`Check-out Date: ${new Date(booking.check_out).toLocaleDateString()}`)
    .text(`Booking Reference: ${booking.id}`);
  doc.moveDown();

  // Purpose and guarantee
  doc.fontSize(12).font('Helvetica')
    .text('The purpose of this visit is tourism and leisure. We guarantee that all accommodation arrangements have been confirmed and paid for. The guest will be staying at our verified property during their visit to Ghana.', { align: 'justify' });
  doc.moveDown();

  doc.text('We kindly request that you consider this application favorably and grant the necessary visa for the specified period.', { align: 'justify' });
  doc.moveDown(2);

  // Closing
  doc.text('Sincerely,');
  doc.moveDown(2);
  doc.fontSize(14).font('Helvetica-Bold')
    .text('CirclePoint Homes Management')
    .text('support@circlepointhomes.com')
    .text('+233 XX XXX XXXX');
  doc.moveDown();

  // Footer
  doc.fontSize(10).font('Helvetica').fillColor('gray')
    .text('This letter is generated automatically and is valid for visa application purposes.', { align: 'center' })
    .text('For verification, please contact us at the above email address.', { align: 'center' });
}
