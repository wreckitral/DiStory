export default class SignupPresenter {
    constructor({ view, api }) {
        this.view = view;
        this.api = api;
    }

    async processSignup(userData) {
        if (!this.view.validateForm()) {
            return;
        }

        this.view.displayLoadingState();

        try {
            const requestData = {
                name: userData.fullName,
                email: userData.email,
                password: userData.password,
            };

            const response = await this.api.getRegistered(requestData);

            if (response.error == false) {
                this.view.showSuccessMessage(response.message);
            } else {
                console.warn(response);
                this.view.showErrorMessage(response.message || 'Account creation failed');
            }
        } catch (error) {
            console.error('Signup process error:', error);
            this.view.showErrorMessage(error.message || 'Unable to process your request');
        } finally {
            this.view.resetButtonState();
        }
    }
}
