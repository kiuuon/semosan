import { Test, TestingModule } from '@nestjs/testing';

import { MountainsController } from './mountains.controller';
import { MountainsService } from './mountains.service';
import { MountainSearchType } from './types/mountain-search-type';

describe('MountainsController', () => {
  let controller: MountainsController;
  let mountainsService: jest.Mocked<MountainsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MountainsController],
      providers: [
        {
          provide: MountainsService,
          useValue: {
            search: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(MountainsController);
    mountainsService = module.get(MountainsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('search delegates to MountainsService', async () => {
    const dto = {
      keyword: '북한산',
      type: MountainSearchType.NAME,
      page: 1,
    };
    const result = {
      items: [
        {
          id: '1',
          name: '북한산',
          region: '서울특별시',
          height: 836,
          imageUrl: 'https://example.com/bukhansan.jpg',
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      hasNext: false,
    };
    mountainsService.search.mockResolvedValue(result);

    await expect(controller.search(dto)).resolves.toEqual(result);
    expect(mountainsService.search).toHaveBeenCalledWith(dto);
  });
});
