import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PongGameClassicComponent } from './pong-game-classic.component';

describe('PongGameClassicComponent', () => {
  let component: PongGameClassicComponent;
  let fixture: ComponentFixture<PongGameClassicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PongGameClassicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PongGameClassicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
