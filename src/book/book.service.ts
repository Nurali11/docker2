import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBookDto) {
    try {
      const book = await this.prisma.book.create({ data });
      return book;
    } catch (error) {
            throw new BadRequestException(error.message);
    }
  }

  async findAll(query: {
    name?: string;
    price?: string;
    authorId?: string; 
    page?: string;
    limit?: string;
  }) {
    try {
      const {
        name,
        price,
        authorId,
        page = '1',
        limit = '10',
      } = query;

      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      const where: Prisma.BookWhereInput = {};
      if (name) where.name = { contains: name, mode: 'insensitive' };
      if (price) where.price = { gte: parseFloat(price) };
      if (authorId) where.authorId = authorId;

      const books = await this.prisma.book.findMany({
        where,
        include: { Author: true },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
      });

      const total = await this.prisma.book.count({ where });

      return {
        data: books,
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
      const book = await this.prisma.book.findFirst({
        where: { id },
        include: { Author: true },
      });
      if (!book) {
        throw new NotFoundException('Kitob topilmadi');
      }
      return book;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
      
    }
  }

  async update(id: string, data: UpdateBookDto) {
    try {
      const book = await this.prisma.book.update({ where: { id }, data });
      return book;
    } catch (error) {
      throw new BadRequestException(error.message);
      
    }
  }

  async remove(id: string) {
    try {
      const book = await this.prisma.book.delete({ where: { id } });
      return book;
    } catch (error) {
      throw new BadRequestException(error.message);
      
    }
  }
}
