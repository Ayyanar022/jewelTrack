import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/common/prisma/prisma.service";



@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(private prisma:PrismaService){
        super({
            jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey:process.env.JWT_SECRET as string,
        });
    } 

    async validate(payload:{sub:string; phone:string}){
        const shop = await this.prisma.shop.findUnique({
            where:{id:payload.sub}
        })

        if(!shop){
            throw new UnauthorizedException();
        }
        return shop
    }
}