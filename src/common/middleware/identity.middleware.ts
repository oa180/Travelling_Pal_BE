import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface IdentityContext {
  travelerId?: number;
  companyId?: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    identity?: IdentityContext;
  }
}

@Injectable()
export class IdentityMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const travelerHeader = req.header('x-traveler-id');
    const companyHeader = req.header('x-company-id');

    const travelerId = travelerHeader ? parseInt(travelerHeader, 10) : undefined;
    const companyId = companyHeader ? parseInt(companyHeader, 10) : undefined;

    req.identity = {
      travelerId: Number.isFinite(travelerId) ? travelerId : undefined,
      companyId: Number.isFinite(companyId) ? companyId : undefined,
    };

    next();
  }
}
