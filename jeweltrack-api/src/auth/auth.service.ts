import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {

    constructor(
        private prisma:PrismaService,
        private jwtService :JwtService
    ){}

    async register(dto:RegisterDto){
        // 1.check if phone exists
        const existing = await this.prisma.shop.findFirst({
            where:{phone:dto.phone}
        })

        if(existing){
            throw new ConflictException('Phone number already registered')
        }

        //2. hash password 
        const hashPassword = await bcrypt.hash(dto.password,10);

        // create shop
        const shop = await this.prisma.shop.create({
            data:{
                name:dto.name,
                owner_name:dto.owner_name,
                phone:dto.phone,
                password :hashPassword 
            }
        })

        return { message : "shop registered successfully ",shopId:shop.id}

    }


    async login(dto:LoginDto){
        //1.check shop 
        const  shop:any = await this.prisma.shop.findFirst({
            where:{phone:dto.phone}
        })

        if(!shop){
            throw new UnauthorizedException("Invalid credentials");
        }

        // 2.compare pass
        const passwordMatch = await bcrypt.compare(dto.password,shop.password)

        if(!passwordMatch){
            throw new UnauthorizedException("Invalid credentials")
        }

        // 3.generate token 
        const payload = {sub:shop.id, phone:shop.phone}
        const token = await this.jwtService.signAsync(payload)

        return {access_token:token}
    }

}
