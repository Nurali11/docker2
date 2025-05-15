import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiQuery } from '@nestjs/swagger';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.userService.register(dto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.userService.verifyOtp(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    return this.userService.login(dto);
  }


  @UseGuards(AuthGuard)
  @Patch('promoteToAdmin')
  async promoteToAdmin(@Req() req: Request) {
    return this.userService.promoteToAdmin(req['user']);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @Get()
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by user name',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Filter by user email',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['ADMIN', 'USER'],
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'email', 'role'],
    description: 'Sort by field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page',
  })
  async findAll(
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('role') role?: 'ADMIN' | 'USER',
    @Query('sortBy') sortBy?: 'name' | 'email' | 'role',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.findAll({
      name,
      email,
      role,
      sortBy,
      sortOrder,
      page,
      limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
