import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Interactive16Component } from './interactive16.component';

describe('Interactive16Component', () => {
  let component: Interactive16Component;
  let fixture: ComponentFixture<Interactive16Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Interactive16Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Interactive16Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
