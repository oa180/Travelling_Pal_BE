import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TravelerId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.identity?.travelerId;
});

export const CompanyId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.identity?.companyId;
});
