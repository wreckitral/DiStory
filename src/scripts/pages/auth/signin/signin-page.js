import SigninPresenter from './signin-presenter';
import * as DistoryAPI from '../../../data/api';
import * as AuthModel from '../../../utils/auth';

export default class SigninPage {
    #presenter = null;
    async render() {
        return `
            <section class="signup-page">
              <div class="signup-card">
                <h1 class="signup-heading">Sign In</h1>
                <form id="login-form" class="signup-form">
                  <div class="input-group">
                    <label for="email-input" class="form-label">Email</label>
                    <input
                      type="email"
                      id="email-input" name="email"
                      class="form-input"
                      placeholder="example@domain.com"
                      required
                    />
                  </div>
                  <div class="input-group">
                    <label for="password-input" class="form-label">Password</label>
                    <input type="password" id="password-input" name="password" class="form-input" required />
                  </div>
                  <div class="form-actions">
                    <div id="submit-button-container">
                      <button type="submit" class="btn-primary">Sign In</button>
                    </div>
                  </div>
                  <p class="login-link">Don't have an account yet? <a href="#/signup">Sign Up</a></p>
                </form>
              </div>
            </section>
        `;
    }

    async afterRender() {
        this.#presenter = new SigninPresenter({
            view: this,
            model: DistoryAPI,
            authModel: AuthModel,
        });
        this.#setupForm();
    }

    #setupForm() {
        document.getElementById('login-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = {
                email: document.getElementById('email-input').value,
                password: document.getElementById('password-input').value,
            };
            await this.#presenter.getLogin(data);
        });
    }

    loginSuccessfully(message) {
        console.log(message);
        location.hash = '/';
    }

    loginFailed(message) {
        alert(message);
    }

    showSubmitLoadingButton() {
        document.getElementById('submit-button-container').innerHTML = `
      <button type="submit" class="btn-primary btn-loading" disabled>
        <span class="spinner"></span> Signing In...
      </button>
    `;
    }

    hideSubmitLoadingButton() {
        document.getElementById('submit-button-container').innerHTML = `
      <button type="submit">Sign In</button>
    `;
    }
}
