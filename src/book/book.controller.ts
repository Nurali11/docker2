import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { RoleStatus } from '@prisma/client';
import { Roles } from 'src/user/decorators/roles.decorators';
import { RoleGuard } from 'src/role/role.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiQuery } from '@nestjs/swagger';

@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Roles(RoleStatus.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createBookDto: CreateBookDto) {
    return this.bookService.create(createBookDto);
  }

  @Get()
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by book name',
  })
  @ApiQuery({
    name: 'price',
    required: false,
    description: 'Filter by book price',
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    description: 'Filter by author ID',
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
    @Query('price') price?: string,
    @Query('authorId') authorId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookService.findAll({
      name,
      price,
      authorId,
      page,
      limit,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookService.findOne(id);
  }

  @Roles(RoleStatus.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.bookService.update(id, updateBookDto);
  }

  @Roles(RoleStatus.ADMIN)
  @UseGuards(RoleGuard)
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookService.remove(id);
  }
}
