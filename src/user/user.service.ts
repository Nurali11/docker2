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
import { totp} from "otplib"

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
      throw new BadRequestException(error.message)
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
      let otp = totp.generate(data.email + "sekret_otp")

      const newUser = await this.prisma.user.create({
        data: {
          ...data,
          password: hash
        },
      });

      try {
        await this.mailer.sendMail(
          data.email,
          'OTP:',
          `OTP: ${otp}.`,
        );
        console.log('OTP sent to: ', data.email);
      } catch (error) {
              throw new BadRequestException(error.message);
      }

      return newUser;
    } catch (error) {
      throw new BadRequestException(error.message)
      

    }
  }

  async verifyOtp(data: VerifyOtpDto) {
    try {
      const { email, otp } = data;

      const user = await this.prisma.user.findFirst({ where: { email } });

      if (!user) throw new NotFoundException('User not found!');

      if (user.isVerified) return { message: 'User already verified' };

      let match = totp.verify({token: data.otp, secret: data.email + "sekret_otp"})
      
      if(!match){
        return "OTP is not valid"
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
        },
      });
      return { message: 'Email verified successfully!' };
    } catch (error) {
      throw new BadRequestException(error.message)
      
    }
  }

  async login(data: LoginUserDto) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: data.email },
      });

      if (!user?.isVerified == true) {
        return 'Please verify you eamil first!';
      }

      if (!user) {
        throw new NotFoundException('User not found!');
      }

      const match = user && (await bcrypt.compare(data.password, user.password));

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

      return { access_token, refresh_token };
    } catch (error) {
      throw new BadRequestException(error.message)
      
    }
  }

  async delete(id: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      let deleted = await this.prisma.user.delete({ where: { id } });
      return deleted;
    } catch (error) {
            throw new BadRequestException(error.message);
    }
  }
}
