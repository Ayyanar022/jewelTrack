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

    async validate(payload:{sub:string; phone:string; role?: string; shopId?: string}){
        const user = await this.prisma.user.findUnique({
            where:{id:payload.sub},
            include:{shop:true}
        })

        if(!user || !user.is_active){
            throw new UnauthorizedException('User account is inactive or not found');
        }
        return user;
    }
}