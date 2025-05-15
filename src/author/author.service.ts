import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAuthorDto) {
    try {
      const author = await this.prisma.author.create({ data });
      return author;
    } catch (error) {
      throw new BadRequestException(error.message);
      
    }
  }

  async findAll(query: {
    name?: string;
    age?: string;
    page?: string;
    limit?: string;
  }) {
    try {
      const {
        name,
        age,
        page = '1',
        limit = '10',
      } = query;

      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      const where: Prisma.AuthorWhereInput = {};
      if (name) where.name = { contains: name, mode: 'insensitive' };
      if (age) where.age = { gte: parseInt(age, 10) };

      const authors = await this.prisma.author.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
      });

      const total = await this.prisma.author.count({ where });

      return {
        data: authors,
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
      const author = await this.prisma.author.findFirst({
        where: { id },
      });
      if (!author) {
        throw new NotFoundException('Muallif topilmadi');
      }
      return author;
    } catch (error) {
      throw new BadRequestException(error.message);
      
    }
  }

  async update(id: string, data: UpdateAuthorDto) {
    try {
      const author = await this.prisma.author.update({ where: { id }, data });
      return author;
    } catch (error) {
      throw new BadRequestException(error.message);
      
    }
  }

  async remove(id: string) {
    try {
      const author = await this.prisma.author.delete({ where: { id } });
      return author;
    } catch (error) {
      throw new BadRequestException(error.message);
      
    }
  }
}
