import SignupPage from '../pages/auth/signup/signup-page';
import SigninPage from '../pages/auth/signin/signin-page';
import HomePage from '../pages/home/home-page';
import CreateStoryPage from '../pages/createStory/create-story-page';
import { checkUnauthenticatedRouteOnly, checkAuthenticatedRoute } from '../utils/auth';
import StoryDetailPage from '../pages/detailStory/story-detail-page';
import FavoritesPage from '../pages/favorite/favorites-page';

export const routes = {
    '/signup': () => checkUnauthenticatedRouteOnly(new SignupPage()),
    '/signin': () => checkUnauthenticatedRouteOnly(new SigninPage()),

    '/': () => checkAuthenticatedRoute(new HomePage()),
    '/create-story': () => checkAuthenticatedRoute(new CreateStoryPage()),
    '/detail-story/:id': () => checkAuthenticatedRoute(new StoryDetailPage()),
    '/favorites': () => checkAuthenticatedRoute(new FavoritesPage()),
};
