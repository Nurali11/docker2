import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Request } from 'express';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { MailService } from 'src/mail/mail.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailer: MailService,
  ) {}

  async findUser(email: string) {
    try {
      const user = await this.prisma.user.findFirst({ where: { email } });
      if (!user) {
        throw new NotFoundException('User not found!');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
            throw new BadRequestException(error.message);

    }
  }

  async findAll(query: {
    name?: string;
    email?: string;
    role?: 'ADMIN' | 'USER';
    sortBy?: 'name' | 'email' | 'role';
    sortOrder?: 'asc' | 'desc';
    page?: string;
    limit?: string;
  }) {
    try {
      const {
        name,
        email,
        role,
        sortBy = 'name',
        sortOrder = 'asc',
        page = '1',
        limit = '10',
      } = query;

      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      const where: Prisma.UserWhereInput = {};
      if (name) where.name = { contains: name, mode: 'insensitive' };
      if (email) where.email = { contains: email, mode: 'insensitive' };
      if (role) where.role = role;

      const users = await this.prisma.user.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
      });

      const total = await this.prisma.user.count({ where });

      return {
        data: users,
        total,
        page: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
      };
    } catch (error) {
            throw new BadRequestException(error.message);

    }
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findFirst({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  private generateOTP(length = 6): string {
    try {
      const digits = '0123456789';
      let otp = '';
      for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
      }
      return otp;
    } catch (error) {
            throw new BadRequestException(error.message);

    }
  }

  async register(data: CreateUserDto) {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new BadRequestException('User already exists!');
      }

      const hash = bcrypt.hashSync(data.password, 10);
      const otp = this.generateOTP();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const newUser = await this.prisma.user.create({
        data: {
          ...data,
          password: hash,
          otp,
          otpExpiresAt,
        },
      });

      try {
        await this.mailer.sendMail(
          data.email,
          'Your OTP Code',
          `Your OTP code is: ${otp}\n\nIt will expire in 5 minutes.`,
        );
        console.log('OTP sent to: ', data.email);
      } catch (error) {
              throw new BadRequestException(error.message);
      }

      return newUser;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
            throw new BadRequestException(error.message);

    }
  }

  async verifyOtp(data: VerifyOtpDto) {
    try {
      const { email, otp } = data;

      const user = await this.prisma.user.findFirst({ where: { email } });

      if (!user) throw new NotFoundException('User not found!');

      if (user.isVerified) return { message: 'User already verified' };

      if (user.otp !== otp) throw new BadRequestException('Invalid OTP!');

      if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
        throw new BadRequestException('OTP expired!');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
        },
      });
      return { message: 'Email verified successfully!' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
            throw new BadRequestException(error.message);

    }
  }

  async login(data: LoginUserDto) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: data.email },
      });

      if (!user?.isVerified == true) {
        return 'You should activate your account before login!';
      }

      if (!user) {
        throw new NotFoundException('User not found!');
      }

      const match =
        user && (await bcrypt.compare(data.password, user.password));

      if (!match) {
        throw new BadRequestException('Wrong credentials!');
      }

      const payload = { id: user.id, role: user.role };

      const access_token = this.jwt.sign(payload, {
        secret: 'accessSecret',
        expiresIn: '15m',
      });

      const refresh_token = this.jwt.sign(payload, {
        secret: 'refreshSecret',
        expiresIn: '7d',
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: refresh_token },
      });

      return { access_token, refresh_token };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
            throw new BadRequestException(error.message);

    }
  }

  async promoteToAdmin(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role === 'ADMIN') {
        return { message: 'User is already an Admin', user };
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { role: 'ADMIN' },
      });

      return {
        message: 'User successfully promoted to Admin',
        user: updatedUser,
      };
    } catch (error) {
            throw new BadRequestException(error.message);

    }
  }

  async delete(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.prisma.user.delete({ where: { id } });
      return { message: 'User deleted successfully' };
    } catch (error) {
            throw new BadRequestException(error.message);
    }
  }
}
