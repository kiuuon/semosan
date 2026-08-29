import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { MountainCoord } from '../schemas/mountain-coord.schema';
import { KakaoLocalService } from './kakao-local.service';
import { MountainsController } from './mountains.controller';
import { MountainsService } from './mountains.service';

describe('MountainsModule', () => {
  it('컨트롤러와 서비스를 제공한다', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MountainsController],
      providers: [
        MountainsService,
        KakaoLocalService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: getModelToken(MountainCoord.name),
          useValue: {},
        },
      ],
    }).compile();

    expect(module.get(MountainsController)).toBeInstanceOf(MountainsController);
    expect(module.get(MountainsService)).toBeInstanceOf(MountainsService);
    expect(module.get(KakaoLocalService)).toBeInstanceOf(KakaoLocalService);
  });
});
