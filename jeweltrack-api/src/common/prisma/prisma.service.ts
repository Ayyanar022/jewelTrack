// What this does — simple explanation:

// PrismaClient — the auto generated database client from your schema
// extends PrismaClient — PrismaService inherits all database methods like this.shop.findMany(), this.customer.create() etc.
// OnModuleInit — when app starts, automatically connects to database
// $connect() — opens the database connection

@Global()  // -> this makes prisma service everywhere 
import { Global,
Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';   // prima client is in node module from 7 version 

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}