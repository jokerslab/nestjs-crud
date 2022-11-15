import { Type } from 'class-transformer';
import { getMetadataArgsStorage } from 'typeorm';
import { OmitType } from '@nestjs/swagger';
import { GetManyDefaultResponse } from '../interfaces';
import { ApiProperty, ApiPropertyProg } from './swagger.helper';

export class SerializeHelper {
  static createGetManyDto(dto: any, resourceName: string): any {
    class GetManyResponseDto implements GetManyDefaultResponse<any> {
      @ApiProperty({ type: dto, isArray: true })
      @Type(() => dto)
      data: any[];

      @ApiProperty({ type: 'number' })
      count: number;

      @ApiProperty({ type: 'number' })
      total: number;

      @ApiProperty({ type: 'number' })
      page: number;

      @ApiProperty({ type: 'number' })
      pageCount: number;
    }

    Object.defineProperty(GetManyResponseDto, 'name', {
      writable: false,
      value: `GetMany${resourceName}ResponseDto`,
    });

    return GetManyResponseDto;
  }

  static createGetOneResponseDto(resourceName: string): any {
    class GetOneResponseDto {}

    Object.defineProperty(GetOneResponseDto, 'name', {
      writable: false,
      value: `${resourceName}ResponseDto`,
    });

    return GetOneResponseDto;
  }

  static createSimpleDto(dto: any, resourceName: string, joinTree: any): any {
    // Depth first search of nested object

    const objRelations = getMetadataArgsStorage().relations.filter((relation) => relation.target === dto);

    const related: any = objRelations.map((relation) => relation.propertyName);

    class SimpleResponseDto extends OmitType(dto, related) {}
    Object.defineProperty(SimpleResponseDto, 'name', {
      writable: false,
      value: `${resourceName}ResponseDto`,
    });
    // Strip out any relations

    // for any relations in the join options, add them to the dto
    const relatedKeys = Object.keys(joinTree);
    if (relatedKeys.length > 0) {
      const rel = objRelations.find((r) => r.propertyName === relatedKeys[0]);
      if (rel) {
        const RelatedResponseDto = rel.type;
        Object.defineProperty(RelatedResponseDto, 'name', {
          writable: false,
          value: `${resourceName}${relatedKeys[0]}ResponseRelatedDto`,
        });

        ApiPropertyProg(
          { type: RelatedResponseDto, required: false },
          SimpleResponseDto.prototype,
          relatedKeys[0] + 'jiggle',
        );
      } else {
        console.log('No relation found for ', relatedKeys[0]);
      }
    }

    return SimpleResponseDto;
  }
}
