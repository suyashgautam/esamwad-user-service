import { Test, TestingModule } from '@nestjs/testing';

import { GupshupService } from './gupshup.service';
import got, { Got } from 'got/dist/source';
import { SMSResponseStatus, SMSType } from '../sms.interface';
jest.mock('got/dist/source');

const getGupsupuFactory = (mockedGot: Got) => {
  const gupshupFactory = {
    provide: GupshupService,
    useFactory: () => {
      return new GupshupService(
        'dummyUsername',
        'dummyGSPass',
        'dummyGSBaseURL',
        mockedGot,
      );
    },
    inject: [],
  };
  return gupshupFactory;
};

describe('GupshupService Wiring', () => {
  let service: GupshupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [getGupsupuFactory(null)],
    }).compile();

    service = module.get<GupshupService>(GupshupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service.httpClient).toBeDefined();
    expect(service.auth).toBeDefined();
    expect(service.baseURL).toBeDefined();
  });
});

describe('GupshupService Negative Use Cases', () => {
  let service: GupshupService;

  beforeEach(async () => {
    const mockedGot = got as jest.Mocked<typeof got>;
    const module: TestingModule = await Test.createTestingModule({
      providers: [getGupsupuFactory(mockedGot)],
    }).compile();
    service = module.get<GupshupService>(GupshupService);
  });

  it('send with null data throws error', () => {
    expect(service.send).toThrowError('Data cannot be null');
  });

  it('send method for hsm not implemented', () => {
    expect(() =>
      service.send({
        phone: '8004472230',
        template: 'abc',
        params: 'abc',
        type: SMSType.hsm,
      }),
    ).toThrowError('Method not implemented.');
  });
});

describe('Gupshup service Success Response', () => {
  let service: GupshupService;

  beforeEach(async () => {
    const mockedGot = got as jest.Mocked<typeof got>;
    mockedGot.get.mockResolvedValueOnce({
      body: 'success | 919812345678 | 728014710863298817-1234567890',
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [getGupsupuFactory(mockedGot)],
    }).compile();
    service = module.get<GupshupService>(GupshupService);
  });

  it('Success Response', async () => {
    const resp1 = await service
      .send({
        phone: '8004472230',
        template: 'abc',
        params: 'abc',
        type: SMSType.otp,
      })
      .then((response) =>
        expect(response).toEqual({
          error: null,
          messageID: '728014710863298817-1234567890',
          networkResponseCode: 200,
          phone: '8004472230',
          provider: 'Gupshup',
          providerResponseCode: null,
          providerSuccessResponse: undefined,
          status: 'success',
        }),
      );
  });
});

describe('Gupshup service Error Response', () => {
  let service: GupshupService;

  beforeEach(async () => {
    const mockedGot = got as jest.Mocked<typeof got>;
    mockedGot.get.mockResolvedValueOnce({
      body: 'error | 107 | The specified version "1.0" is invalid. Please specify version as "1.1"',
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [getGupsupuFactory(mockedGot)],
    }).compile();
    service = module.get<GupshupService>(GupshupService);
  });

  it('Error Response', async () => {
    const resp1 = await service
      .send({
        phone: '8004472230',
        template: 'abc',
        params: 'abc',
        type: SMSType.otp,
      })
      .then((response) =>
        expect(response).toEqual({
          error: {
            errorCode: '107',
            errorText:
              'The specified version "1.0" is invalid. Please specify version as "1.1"',
          },
          messageID: null,
          networkResponseCode: 200,
          phone: '8004472230',
          provider: 'Gupshup',
          providerResponseCode: '107',
          providerSuccessResponse: null,
          status: 'failure',
        }),
      );
  });
});

describe('Gupshup service Success With Incorrect response', () => {
  let service: GupshupService;

  beforeEach(async () => {
    const mockedGot = got as jest.Mocked<typeof got>;
    const module: TestingModule = await Test.createTestingModule({
      providers: [getGupsupuFactory(mockedGot)],
    }).compile();
    service = module.get<GupshupService>(GupshupService);
  });

  it('Should not parse empty response', () => {
    expect(service.parseResponse(undefined)).toEqual({
      messageID: null,
      providerSuccessResponse: null,
      providerResponseCode: null,
      error: {
        errorText:
          "Gupshup response could not be parsed :: Cannot read property 'split' of undefined; Provider Response - undefined",
        errorCode: 'CUSTOM ERROR',
      },
      status: SMSResponseStatus.failure,
    });
  });
});

//Testing the verify function
describe('Gupshup service track negative cases', () => {
  let service: GupshupService;

  beforeEach(async () => {
    const mockedGot = got as jest.Mocked<typeof got>;
    const module: TestingModule = await Test.createTestingModule({
      providers: [getGupsupuFactory(mockedGot)],
    }).compile();
    service = module.get<GupshupService>(GupshupService);
  });

  it('track with null data throws error', () => {
    expect(service.track).toThrowError('Data cannot be null');
  });

  it('track method for hsm not implemented', () => {
    expect(() =>
      service.track({
        phone: '8004472230',
        template: 'abc',
        params: 'abc',
        type: SMSType.hsm,
      }),
    ).toThrowError('Method not implemented.');
  });
});

describe('Gupshup service track positive case', () => {
  let service: GupshupService;

  beforeEach(async () => {
    const mockedGot = got as jest.Mocked<typeof got>;
    mockedGot.get.mockResolvedValueOnce({
      body: 'success | 919XXXXXXXXX | 3545913275288024429 | OTP matched ',
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [getGupsupuFactory(mockedGot)],
    }).compile();
    service = module.get<GupshupService>(GupshupService);
  });
  it('track method correct response', async () => {
    const rep2 = await service
      .track({
        phone: '8004472230',
        template: 'abc',
        params: 'abc',
        type: SMSType.otp,
      })
      .then((data) => {
        expect(data).toEqual({
          provider: 'Gupshup',
          phone: '8004472230',
          networkResponseCode: 200,
          messageID: '3545913275288024429',
          error: null,
          providerResponseCode: null,
          providerSuccessResponse: 'OTP matched',
          status: 'success',
        });
      });
  });
});

describe('Gupshup service track error response', () => {
  let service: GupshupService;

  beforeEach(async () => {
    const mockedGot = got as jest.Mocked<typeof got>;
    mockedGot.get.mockResolvedValueOnce({
      body: undefined,
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [getGupsupuFactory(mockedGot)],
    }).compile();
    service = module.get<GupshupService>(GupshupService);
  });
  it('track method error response', async () => {
    const rep2 = await service
      .track({
        phone: '8004472230',
        template: 'abc',
        params: 'abc',
        type: SMSType.otp,
      })
      .then((data) => {
        expect(data).toEqual({
          provider: 'Gupshup',
          phone: '8004472230',
          networkResponseCode: 200,
          messageID: null,
          error: {
            errorText:
              "Gupshup response could not be parsed :: Cannot read property 'split' of undefined; Provider Response - undefined",
            errorCode: 'CUSTOM ERROR',
          },
          providerResponseCode: null,
          providerSuccessResponse: null,
          status: 'failure',
        });
      });
  });
});
