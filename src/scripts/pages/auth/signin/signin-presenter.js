export default class SigninPresenter {
    #view;
    #model;
    #authModel;

    constructor({ view, model, authModel }) {
        this.#view = view;
        this.#model = model;
        this.#authModel = authModel;
    }

    async getLogin({ email, password }) {
        try {
            this.#view.showSubmitLoadingButton();

            const response = await this.#model.getLogin({ email, password });

            if (!response || response.error == true) {
                throw new Error('Login gagal. Silakan periksa email dan password Anda.');
            }

            await this.#authModel.putAccessToken(response.loginResult.token);
            this.#view.loginSuccessfully('Login berhasil');
        } catch (error) {
            this.#view.loginFailed(error.message);
        } finally {
            this.#view.hideSubmitLoadingButton();
        }
    }
}
