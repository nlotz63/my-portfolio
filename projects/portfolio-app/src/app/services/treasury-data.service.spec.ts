import { TestBed } from '@angular/core/testing';

import { TreasuryDataService } from './treasury-data.service';

describe('TreasuryDataService', () => {
  let service: TreasuryDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TreasuryDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
