import { Test, TestingModule } from '@nestjs/testing';

import { RecordFilter } from 'src/workspace/workspace-query-builder/interfaces/record.interface';
import { FindDuplicatesResolverArgs } from 'src/workspace/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { ArgsAliasFactory } from 'src/workspace/workspace-query-builder/factories/args-alias.factory';
import { FieldsStringFactory } from 'src/workspace/workspace-query-builder/factories/fields-string.factory';
import { FindDuplicatesQueryFactory } from 'src/workspace/workspace-query-builder/factories/find-duplicates-query.factory';
import { workspaceQueryBuilderOptions } from 'src/workspace/workspace-query-builder/utils-test/workspace-query-builder-options';

describe('FindDuplicatesQueryFactory', () => {
  let service: FindDuplicatesQueryFactory;
  const argAliasCreate = jest.fn();

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindDuplicatesQueryFactory,
        {
          provide: FieldsStringFactory,
          useValue: {
            create: jest.fn().mockResolvedValue('fieldsString'),
            // Mock implementation of FieldsStringFactory methods if needed
          },
        },
        {
          provide: ArgsAliasFactory,
          useValue: {
            create: argAliasCreate,
            // Mock implementation of ArgsAliasFactory methods if needed
          },
        },
      ],
    }).compile();

    service = module.get<FindDuplicatesQueryFactory>(
      FindDuplicatesQueryFactory,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return (first: 0) as a filter when args are missing', async () => {
      const args: FindDuplicatesResolverArgs<RecordFilter> = {};

      const query = await service.create(args, workspaceQueryBuilderOptions);

      expect(query.trim()).toEqual(`query {
        objectNameCollection(first: 0) {
          fieldsString
        }
      }`);
    });

    it('should use firstName and lastName as a filter when both args are present', async () => {
      argAliasCreate.mockReturnValue({
        nameFirstName: 'John',
        nameLastName: 'Doe',
      });

      const args: FindDuplicatesResolverArgs<RecordFilter> = {
        data: {
          name: {
            firstName: 'John',
            lastName: 'Doe',
          },
        } as unknown as RecordFilter,
      };

      const query = await service.create(args, {
        ...workspaceQueryBuilderOptions,
        objectMetadataItem: {
          ...workspaceQueryBuilderOptions.objectMetadataItem,
          nameSingular: 'person',
        },
      });

      expect(query.trim()).toEqual(`query {
        personCollection(filter: {or:[{nameFirstName:{ilike:\"%John%\"},nameLastName:{ilike:\"%Doe%\"}}]}) {
          fieldsString
        }
      }`);
    });

    it('should return (first: 0) as a filter when only firstName is present', async () => {
      argAliasCreate.mockReturnValue({
        nameFirstName: 'John',
      });

      const args: FindDuplicatesResolverArgs<RecordFilter> = {
        data: {
          name: {
            firstName: 'John',
          },
        } as unknown as RecordFilter,
      };

      const query = await service.create(args, {
        ...workspaceQueryBuilderOptions,
        objectMetadataItem: {
          ...workspaceQueryBuilderOptions.objectMetadataItem,
          nameSingular: 'person',
        },
      });

      expect(query.trim()).toEqual(`query {
        personCollection(first: 0) {
          fieldsString
        }
      }`);
    });

    it('should use "currentRecord" as query args when its present', async () => {
      argAliasCreate.mockReturnValue({
        nameFirstName: 'John',
      });

      const args: FindDuplicatesResolverArgs<RecordFilter> = {
        id: 'uuid',
      };

      const query = await service.create(
        args,
        {
          ...workspaceQueryBuilderOptions,
          objectMetadataItem: {
            ...workspaceQueryBuilderOptions.objectMetadataItem,
            nameSingular: 'person',
          },
        },
        {
          nameFirstName: 'Peter',
          nameLastName: 'Parker',
        },
      );

      expect(query.trim()).toEqual(`query {
        personCollection(filter: {id:{neq:\"uuid\"},or:[{nameFirstName:{ilike:\"%Peter%\"},nameLastName:{ilike:\"%Parker%\"}}]}) {
          fieldsString
        }
      }`);
    });
  });

  describe('buildQueryForExistingRecord', () => {
    it(`should include all the fields that exist for person inside "duplicateCriteriaCollection" constant`, async () => {
      const query = service.buildQueryForExistingRecord('uuid', {
        ...workspaceQueryBuilderOptions,
        objectMetadataItem: {
          ...workspaceQueryBuilderOptions.objectMetadataItem,
          nameSingular: 'person',
        },
      });

      expect(query.trim()).toEqual(`query {
        personCollection(filter: { id: { eq: \"uuid\" }}){
          edges {
            node {
              __typename
              nameFirstName
nameLastName
linkedinLinkUrl
email
            }
          }
        }
      }`);
    });
  });
});
