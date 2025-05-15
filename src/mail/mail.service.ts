import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
            pass: 'pkft jpwd jfjw curu',
            user: 'boltaboyevnurali218@gmail.com'
    },
  });

  async sendMail(to: string, subject: string, text: string) {
    try {
      let mail = await this.transporter.sendMail({
        to,
        subject,
        text,
      });
      return 'Jonatilidi emailga otp!';
    } catch (error) {
      return error;
    }
  }
}
