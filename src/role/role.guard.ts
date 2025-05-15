import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleStatus } from '@prisma/client';
import { ROLES_KEY } from 'src/user/decorators/roles.decorators';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const KerakliRollar = this.reflector.getAllAndOverride<RoleStatus[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!KerakliRollar) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole = request['role'];

    if (!userRole) {
      throw new UnauthorizedException('Role not found');
    }

    if (KerakliRollar.some((role) => role === userRole)) {
      return true;
    }

    throw new UnauthorizedException(
      `You are not allowed to do this only one of these roles can: ${KerakliRollar.join(', ')}`,
    );
  }
}
