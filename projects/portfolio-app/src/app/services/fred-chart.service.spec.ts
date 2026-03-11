import { TestBed } from '@angular/core/testing';

import { FredChartService } from './fred-chart.service';

describe('FredChartService', () => {
  let service: FredChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FredChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
