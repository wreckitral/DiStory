import SignupPresenter from './signup-presenter';
import * as DistoryAPI from '../../../data/api';

export default class SignupPage {
    constructor() {
        this.presenter = null;
    }

    async render() {
        return `
      <div class="signup-page">
        <div class="signup-card">
          <h2 class="signup-heading">Join Distory</h2>
          <p class="signup-tagline">Create an account to share your stories with the world</p>
          <form id="signup-form" class="signup-form">
            <div class="input-group">
              <label for="fullname" class="form-label">Full Name</label>
              <div class="input-wrapper">
                <input
                  type="text"
                  id="fullname"
                  class="form-input"
                  placeholder="Enter your full name"
                  required
                >
              </div>
            </div>

            <div class="input-group">
              <label for="email-address" class="form-label">Email Address</label>
              <div class="input-wrapper">
                <input
                  type="email"
                  id="email-address"
                  class="form-input"
                  placeholder="example@domain.com"
                  required
                >
              </div>
            </div>

            <div class="input-group">
              <label for="user-password" class="form-label">Password</label>
              <div class="input-wrapper">
                <input
                  type="password"
                  id="user-password"
                  class="form-input"
                  placeholder="Create a strong password"
                  required
                >
              </div>
            </div>
            <div class="form-actions">
              <div id="action-button-container">
                <button type="submit" class="btn-primary">Start Your Story Journey</button>
              </div>
              <p class="login-link">Already a storyteller? <a href="#/signin">Sign In</a></p>
            </div>
          </form>
        </div>
      </div>
    `;
    }

    async afterRender() {
        this.presenter = new SignupPresenter({
            view: this,
            api: DistoryAPI,
        });

        this._initializeEventListeners();
    }

    _initializeEventListeners() {
        const form = document.getElementById('signup-form');
        const emailField = document.getElementById('email-address');

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const userData = {
                fullName: document.getElementById('fullname').value,
                email: emailField.value,
                password: document.getElementById('user-password').value,
            };

            await this.presenter.processSignup(userData);
        });
    }

    showSuccessMessage(message) {
        console.log(`Signup success: ${message}`);
        window.location.hash = '/signin';
    }

    showErrorMessage(error) {
        window.alert(`${error}`);
    }

    displayLoadingState() {
        document.getElementById('action-button-container').innerHTML = `
      <button type="submit" class="btn-primary btn-loading" disabled>
        <span class="spinner"></span> Creating Account...
      </button>
    `;
    }

    resetButtonState() {
        document.getElementById('action-button-container').innerHTML = `
      <button type="submit" class="btn-primary">Create Account</button>
    `;
    }

    validateForm() {
        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('email-address').value;
        const password = document.getElementById('user-password').value;

        let isValid = true;
        let errorMessage = '';

        if (!fullname || fullname.trim().length < 3) {
            isValid = false;
            errorMessage = 'Name must be at least 3 characters';
        } else if (!email || !email.includes('@')) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        } else if (!password || password.length < 6) {
            isValid = false;
            errorMessage = 'Password must be at least 6 characters';
        }

        if (!isValid) {
            this.showErrorMessage(errorMessage);
        }

        return isValid;
    }
}
