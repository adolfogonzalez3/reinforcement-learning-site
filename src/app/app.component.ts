import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterOutlet } from '@angular/router'
import { PongGameComponent } from './pong-game/pong-game.component'
import { AgentService } from './agent-service/agent.service'

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [CommonModule, RouterOutlet, PongGameComponent]
})
export class AppComponent {
  title = 'reinforcement-learning-site'

  constructor() {
    
  }
}
