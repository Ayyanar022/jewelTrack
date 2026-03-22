import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist :true,
    forbidNonWhitelisted:true
  }))

  //swagger setup
const config = new DocumentBuilder()
  .setTitle('JewelTrack API')
  .setDescription('Jewellery shop management SaaS API')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    'JWT-auth',
  )
  .build();

        const document = SwaggerModule.createDocument(app,config);
        SwaggerModule.setup('api',app,document)
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
