import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService:AuthService){}

    @Post('register')
    register(@Body() dto:RegisterDto){
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body()dto:LoginDto){
        return this.authService.login(dto)
    }
    
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@Request()req:any){
        return req.user;
    }
}
