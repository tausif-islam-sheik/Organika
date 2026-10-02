import "dotenv/config";
import "reflect-metadata";
import { join } from "path";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cookieParser());
  app.useStaticAssets(join(__dirname, "..", "uploads"), { prefix: "/uploads/" });
  app.enableCors({ origin: ["http://localhost:3000"], credentials: true });
  await app.listen(process.env.PORT ?? 4000);
  // eslint-disable-next-line no-console
  console.log(`backend listening on ${await app.getUrl()}`);
}
bootstrap();
