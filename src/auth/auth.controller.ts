import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    const user = await this.authService.signup(dto);
    return {
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        companyId: (user as any).companyId ?? null,
        travelerId: (user as any).travelerId ?? null,
      },
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const res = await this.authService.login(dto);
    return res;
  }

  // Stateless logout: the client should discard the token. This endpoint exists for symmetry/analytics.
  @Post('logout')
  async logout() {
    return { success: true };
  }
}
