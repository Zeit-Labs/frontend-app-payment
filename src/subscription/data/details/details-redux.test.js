// import Cookies from 'universal-cookie';
import { createStore, combineReducers } from 'redux';

import { reducer } from '../reducers';
import {
  subscriptionDetailsReceived,
  subscriptionDetailsProcessing,
  submitSubscription,
  fetchSubscriptionDetails,
} from './actions';
import { subscriptionSelector } from './selectors';

jest.mock('universal-cookie', () => {
  class MockCookies {
    static result = {};

    get() {
      return MockCookies.result;
    }
  }
  return MockCookies;
});

describe('subscription details redux tests', () => {
  let store;

  beforeEach(() => {
    store = createStore(combineReducers({
      subscription: reducer,
    }));
  });

  describe('selectors', () => {
    // describe('details', () => {
    it('default state', () => {
      const result = subscriptionSelector(store.getState());
      expect(result).toEqual({
        loading: true,
        loaded: false,
        submitting: false,
        redirect: false,
        enableStripePaymentProcessor: true,
        isSubscriptionDetailsProcessing: false,
        products: [],
        paymentMethod: 'stripe',
      });
    });
  });

  describe('details reducer', () => {
    it('should load the initialState when mount', () => {
      // Its base state
      expect(store.getState().subscription.details.loading).toBe(true);

      // If an action isn't appropriate for it
      store.dispatch({ type: 'SOMETHING_ELSE' });
      expect(store.getState().subscription.details.loading).toBe(true);
    });

    it('SUBSCRIPTION_DETAILS_RECEIVED action', () => {
      store.dispatch(subscriptionDetailsReceived({ foo: 'bar' }));
      expect(store.getState().subscription.details.foo).toBe('bar');
      expect(store.getState().subscription.details.loading).toBe(false);
      expect(store.getState().subscription.details.loaded).toBe(true);
    });

    describe('SUBSCRIPTION_DETAILS_PROCESSING action', () => {
      it('SUBSCRIPTION_DETAILS_PROCESSING true action', () => {
        store.dispatch(subscriptionDetailsProcessing(true));
        expect(store.getState().subscription.details.isSubscriptionDetailsProcessing).toBe(true);
      });

      it('BASKET_PROCESSING false action', () => {
        store.dispatch(subscriptionDetailsProcessing(false));
        expect(store.getState().subscription.details.isSubscriptionDetailsProcessing).toBe(false);
      });
    });

    describe('submitSubscription actions', () => {
      const paymentProcessors = [
        'stripe',
      ];

      test.each(paymentProcessors)('submitSubscription.TRIGGER action', (processor) => {
        store.dispatch(submitSubscription({ method: processor }));
        expect(store.getState().subscription.details.paymentMethod).toBe(processor);
      });

      it('submitSubscription.REQUEST action', () => {
        store.dispatch(submitSubscription({ method: 'PayPal' }));
        expect(store.getState().subscription.details.paymentMethod).toBe('PayPal');
      });

      it('submitSubscription.REQUEST action', () => {
        store.dispatch(submitSubscription.request());
        expect(store.getState().subscription.details.submitting).toBe(true);
      });

      it('submitSubscription.SUCCESS action', () => {
        store.dispatch(submitSubscription.success());
        expect(store.getState().subscription.details.redirect).toBe(true);
      });

      it('submitSubscription.FULFILL action', () => {
        store.dispatch(submitSubscription.fulfill());
        expect(store.getState().subscription.details.submitting).toBe(false);
        expect(store.getState().subscription.details.paymentMethod).toBeUndefined();
      });
    });

    describe('fetchBasket actions', () => {
      test.only('fetchBasket.TRIGGER action', () => {
        store.dispatch(fetchSubscriptionDetails());
        expect(store.getState().subscription.details.loading).toBe(true);
      });

      it('fetchBasket.FULFILL action', () => {
        store.dispatch(fetchSubscriptionDetails.fulfill());
        expect(store.getState().subscription.details.loading).toBe(false);
        expect(store.getState().subscription.details.loaded).toBe(true);
      });
    });
  });
});
