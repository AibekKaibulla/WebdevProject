import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { IUser } from '../../models/user.model';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})

export class HeaderComponent {
  private authService = inject(AuthService);

  currentUser$: Observable<IUser | null> = this.authService.currentUser$;

  logout(): void {
    this.authService.logout();
  }

}
