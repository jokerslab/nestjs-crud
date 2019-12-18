import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { isNil } from '@nestjsx/util';
import { classToPlain, classToPlainFromExist } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CrudActions } from '../enums';
import { SerializeOptions } from '../interfaces';
import { CrudBaseInterceptor } from './crud-base.interceptor';

const actionToDtoNameMap: {
  [key in CrudActions]: keyof SerializeOptions;
} = {
  [CrudActions.ReadAll]: 'getMany',
  [CrudActions.ReadOne]: 'get',
  [CrudActions.CreateMany]: 'createMany',
  [CrudActions.CreateOne]: 'create',
  [CrudActions.UpdateOne]: 'update',
  [CrudActions.ReplaceOne]: 'replace',
  [CrudActions.DeleteAll]: 'delete',
  [CrudActions.DeleteOne]: 'delete',
};

@Injectable()
export class CrudResponseInterceptor extends CrudBaseInterceptor
  implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.serialize(context, data)));
  }

  protected transform(dto: any, data: any, forced = false) {
    if (!(dto && data && data.constructor !== Object) && !forced) {
      return data;
    }

    return data instanceof dto
      ? classToPlain(data)
      : classToPlain(classToPlainFromExist(data, new dto()));
  }

  protected serialize(context: ExecutionContext, data: any): any {
    const { crudOptions, action } = this.getCrudInfo(context);
    const { serialize } = crudOptions;
    const dto = serialize[actionToDtoNameMap[action]];
    const isArray = Array.isArray(data);

    switch (action) {
      case CrudActions.ReadAll:
        const defaultPaginated =
          !isNil(data) &&
          !isNil(data.data) &&
          !isNil(data.count) &&
          !isNil(data.total) &&
          !isNil(data.page) &&
          !isNil(data.pageCount);

        return isArray
          ? (data as any[]).map((item) => this.transform(serialize.get, item))
          : this.transform(dto, data, defaultPaginated);
      case CrudActions.CreateMany:
        return isArray
          ? (data as any[]).map((item) => this.transform(dto, item))
          : this.transform(dto, data);
      default:
        return this.transform(dto, data);
    }
  }
}
