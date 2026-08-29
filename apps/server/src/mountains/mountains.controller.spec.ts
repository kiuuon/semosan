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
            recommend: jest.fn(),
            getDetail: jest.fn(),
            getCoordinates: jest.fn(),
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

  it('recommend delegates to MountainsService', async () => {
    const dto = { page: 1 };
    const result = {
      items: [],
      season: '03' as const,
      theme: null,
      keywordLabel: '가을',
      headline: '가을 산이 가장 예쁜 때',
      subline: '주말 산행으로 딱 좋은 곳이에요',
    };
    mountainsService.recommend.mockResolvedValue(result);

    await expect(controller.recommend(dto)).resolves.toEqual(result);
    expect(mountainsService.recommend).toHaveBeenCalledWith(dto);
  });

  it('getDetail delegates to MountainsService', async () => {
    const dto = {
      name: '관악산',
      region: '서울특별시 관악구',
    };
    const result = {
      id: '20000059',
      name: '관악산',
      region: '서울특별시 관악구ㆍ금천구, 경기도 안양시ㆍ과천시',
      height: 632,
      imageUrl: 'https://example.com/gwanak.jpg',
      subtitle: '불의 산',
      description: '상세 설명',
      transportInfo: '지하철 이용',
    };
    mountainsService.getDetail.mockResolvedValue(result);

    await expect(controller.getDetail('20000059', dto)).resolves.toEqual(result);
    expect(mountainsService.getDetail).toHaveBeenCalledWith('20000059', dto);
  });

  it('getCoordinates는 MountainsService에 위임한다', async () => {
    const dto = {
      name: '관악산',
      region: '서울특별시 관악구',
    };
    const result = {
      id: '20000059',
      name: '관악산',
      region: '서울특별시 관악구',
      lat: 37.4419,
      lng: 126.9638,
      placeName: '관악산',
    };
    mountainsService.getCoordinates.mockResolvedValue(result);

    await expect(controller.getCoordinates('20000059', dto)).resolves.toEqual(result);
    expect(mountainsService.getCoordinates).toHaveBeenCalledWith('20000059', dto);
  });
});
