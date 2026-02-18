import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Interactive01 } from './interactive01';

describe('Interactive01', () => {
  let component: Interactive01;
  let fixture: ComponentFixture<Interactive01>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Interactive01]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Interactive01);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
