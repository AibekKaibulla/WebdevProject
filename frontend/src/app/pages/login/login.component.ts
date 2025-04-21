import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router, RouterModule } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';
import { ILoginCredentials } from '../../models/auth.model'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
      CommonModule,
      FormsModule, 
      RouterModule 
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginData: ILoginCredentials = {
    username: '',
    password: ''
  };
  errorMessage: string | null = null;
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(): void {
    if (!this.loginData.username || !this.loginData.password) {
      this.errorMessage = 'Please enter both username and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null; 

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Login successful:', response);
        this.router.navigate(['/']); // Navigate to home page
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Login failed. Please check your credentials.'; 
        console.error('Login error:', error);
      }
    });
  }
}