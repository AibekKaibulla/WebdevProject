import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router, RouterModule } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';
import { IRegisterPayload } from '../../models/auth.model'; 

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
      CommonModule,
      FormsModule, 
      RouterModule 
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerData: IRegisterPayload = {
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: ''
  };
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(): void {
    // Basic check (more thorough validation can be added)
    if (this.registerData.password !== this.registerData.password2) {
        this.errorMessage = 'Passwords do not match.';
        this.successMessage = null;
        return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const payload: IRegisterPayload = { ...this.registerData };

    this.authService.register(payload).subscribe({
        next: (registeredUser) => {
            this.isLoading = false;
            this.successMessage = `Registration successful for ${registeredUser.username}! Please log in.`;
            console.log('Registration successful:', registeredUser);
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000); // Redirect after 2 seconds
        },
        error: (error) => {
            this.isLoading = false;
            if (error.message && error.message.includes('{') && error.message.includes('}')) {
                try {
                    const errors = JSON.parse(error.message.substring(error.message.indexOf('{'), error.message.lastIndexOf('}') + 1));
                    let messages = [];
                    for (const key in errors) {
                        messages.push(`${key}: ${errors[key].join(', ')}`);
                    }
                    this.errorMessage = messages.join('; ');
                } catch (e) {
                    this.errorMessage = error.message || 'Registration failed. Please try again.';
                }
            } else {
              this.errorMessage = error.message || 'Registration failed. Please try again.';
            }
            console.error('Registration error:', error);
        }
    });
  }
}