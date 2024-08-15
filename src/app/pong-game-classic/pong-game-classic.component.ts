import { Component, ElementRef, ViewChild } from '@angular/core'

@Component({
  selector: 'app-pong-game-classic',
  standalone: true,
  imports: [],
  templateUrl: './pong-game-classic.component.html',
  styleUrl: './pong-game-classic.component.scss'
})
export class PongGameClassicComponent {
  @ViewChild('canvas')
  private readonly canvas!: ElementRef<HTMLCanvasElement>

  
}
