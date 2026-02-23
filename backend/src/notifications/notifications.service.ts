import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST', 'smtp.gmail.com'),
      port: parseInt(this.configService.get('EMAIL_PORT', '587')),
      secure: false,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM', 'noreply@bookingplatform.com'),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendSMS(to: string, message: string): Promise<void> {
    try {
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
      const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');

      if (!accountSid || !authToken) {
        this.logger.warn('Twilio credentials not configured, skipping SMS');
        return;
      }

      const twilio = require('twilio')(accountSid, authToken);
      await twilio.messages.create({
        body: message,
        from: fromNumber,
        to,
      });
      this.logger.log(`SMS sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendBookingConfirmation(bookingId: string): Promise<void> {
    this.logger.log(`Sending booking confirmation for booking ${bookingId}`);
    // In production, fetch booking details and send personalized email
  }

  async sendBookingReminder(bookingId: string, hoursBeforeAppointment: number): Promise<void> {
    this.logger.log(`Sending ${hoursBeforeAppointment}h reminder for booking ${bookingId}`);
    // In production, fetch booking details and send reminder
  }

  async sendBookingCancellation(bookingId: string): Promise<void> {
    this.logger.log(`Sending cancellation notification for booking ${bookingId}`);
  }

  getBookingConfirmationTemplate(data: {
    clientName: string;
    serviceName: string;
    businessName: string;
    startTime: Date;
    amount: number;
    currency: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Booking Confirmation</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #4F46E5; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Booking Confirmed! ✓</h1>
          </div>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
            <p>Hello ${data.clientName},</p>
            <p>Your booking has been confirmed. Here are the details:</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; font-weight: bold;">Service:</td><td>${data.serviceName}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Business:</td><td>${data.businessName}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Date & Time:</td><td>${data.startTime.toLocaleString()}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Amount:</td><td>${data.currency} ${(data.amount / 100).toFixed(2)}</td></tr>
            </table>
            <p>Thank you for booking with us!</p>
          </div>
        </body>
      </html>
    `;
  }
}
