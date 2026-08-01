import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { MountainsController } from './mountains.controller';
import { MountainsModule } from './mountains.module';
import { MountainsService } from './mountains.service';

describe('MountainsModule', () => {
  it('컨트롤러와 서비스를 제공한다', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), MountainsModule],
    }).compile();

    expect(module.get(MountainsController)).toBeInstanceOf(MountainsController);
    expect(module.get(MountainsService)).toBeInstanceOf(MountainsService);
  });
});
