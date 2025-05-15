import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './book/book.module';
import { AuthorModule } from './author/author.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [BookModule, AuthorModule, UserModule, PrismaModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
