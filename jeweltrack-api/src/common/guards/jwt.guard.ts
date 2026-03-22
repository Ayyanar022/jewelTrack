import {  Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";



@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt'){}



// note 
// 1. AuthGuard('jwt') — tells Passport to use JWT strategy to verify the token on every request.
// But we also need a JWT Strategy — which tells Passport HOW to verify the token.