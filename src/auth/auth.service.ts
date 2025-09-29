import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CompanyType, UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async signup(dto: SignupDto) {
    if (!dto.email && !dto.mobile) {
      throw new BadRequestException('Provide email or mobile');
    }
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.mobile ? [{ mobile: dto.mobile }] : []),
        ],
      },
    });
    if (existing) throw new BadRequestException('User already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email ?? null,
        mobile: dto.mobile ?? null,
        passwordHash,
        role: dto.role as UserRole,
      },
    });
    // Link entity by role
    let linked: { companyId?: number; travelerId?: number } = {};
    if (dto.role === UserRole.COMPANY) {
      if (!dto.companyName || !dto.companyType) {
        throw new BadRequestException('companyName and companyType are required for COMPANY signup');
      }
      const company = await this.prisma.company.create({
        data: {
          name: dto.companyName,
          type: dto.companyType as CompanyType,
          userId: user.id,
        },
        select: { id: true },
      });
      linked.companyId = company.id;
    } else if (dto.role === UserRole.TRAVELER) {
      if (!dto.name) {
        throw new BadRequestException('name is required for TRAVELER signup');
      }
      const traveler = await this.prisma.traveler.create({
        data: {
          name: dto.name,
          userId: user.id,
        },
        select: { id: true },
      });
      linked.travelerId = traveler.id;
    }
    return { ...user, ...linked };
  }

  async login(dto: LoginDto) {
    if (!dto.email && !dto.mobile) {
      throw new BadRequestException('Provide email or mobile');
    }
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.mobile ? [{ mobile: dto.mobile }] : []),
        ],
      },
      include: { company: true, traveler: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      mobile: user.mobile,
      companyId: user.company?.id ?? null,
      travelerId: user.traveler?.id ?? null,
    };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        mobile: user.mobile,
        companyId: user.company?.id ?? null,
        travelerId: user.traveler?.id ?? null,
      },
    };
  }
}
