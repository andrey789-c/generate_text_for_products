import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { GenerationsModule } from './generations/generations.module';
import { ProductsModule } from './products/products.module';
import { BulkGenerationsModule } from './bulk-generations/bulk-generations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    PrismaModule,
    GenerationsModule,
    ProductsModule,
    BulkGenerationsModule,
  ],
})
export class AppModule {}
