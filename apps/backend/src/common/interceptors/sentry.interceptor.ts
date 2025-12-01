import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Only create transaction if Sentry is initialized
    const transaction = Sentry.startTransaction?.({
      op: 'http.server',
      name: `${request.method} ${request.route?.path || request.url}`,
    });

    if (transaction) {
      Sentry.getCurrentHub().configureScope((scope) => {
        scope.setSpan(transaction);
        scope.setUser({
          id: request.user?.id,
          email: request.user?.email,
        });
        scope.setTag('requestId', request.requestId);
      });
    }

    return next.handle().pipe(
      tap({
        next: () => {
          transaction?.setHttpStatus?.(200);
          transaction?.finish?.();
        },
        error: (error) => {
          transaction?.setHttpStatus?.(error.status || 500);
          transaction?.finish?.();
        },
      }),
    );
  }
}
