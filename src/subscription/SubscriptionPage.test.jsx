/* eslint-disable react/jsx-no-constructed-context-values */
/* eslint-disable global-require */
import React from 'react';
import { Factory } from 'rosie';
import Cookies from 'universal-cookie';

import './__factories__/subscription.factory';
import '../payment/__factories__/userAccount.factory';
import {
  render, act, screen, store,
} from './test-utils';
import { SubscriptionPage } from './SubscriptionPage';
import { fetchSubscriptionDetails, subscriptionDetailsReceived } from './data/details/actions';
import { camelCaseObject } from '../payment/data/utils';

jest.mock('universal-cookie', () => {
  class MockCookies {
    static result = {
      [process.env.LANGUAGE_PREFERENCE_COOKIE_NAME]: 'en',
      [process.env.CURRENCY_COOKIE_NAME]: {
        code: 'MXN',
        rate: 19.092733,
      },
    };

    get(cookieName) {
      return MockCookies.result[cookieName];
    }
  }
  return MockCookies;
});

/**
 * SubscriptionPage Integration Test
 */
describe('<SubscriptionPage />', () => {
  let subscriptionDetails;
  beforeEach(() => {
    subscriptionDetails = camelCaseObject(Factory.build('subscription', {}, { numProducts: 2 }));
  });

  it('should render the <SubscriptionPage/> component with loading state', async () => {
    render(<SubscriptionPage />);
    expect(screen.getByTestId('loading-page')).toBeDefined();
  });

  it('should render the <SubscriptionPage/> with the subscription details', () => {
    // const { container } = render(<SubscriptionPage />);
    render(<SubscriptionPage />);
    act(() => {
      store.dispatch(
        subscriptionDetailsReceived(
          subscriptionDetails,
        ),
      );
      store.dispatch(fetchSubscriptionDetails.fulfill());
    });
    // expect(container).toMatchSnapshot();
    // screen.debug(undefined, 10000);
    // verify that `SubscriptionBadge is present in the DOM
    expect(screen.getByText('Subscription')).toBeDefined();
    // verify that `price` is converted and present in the DOM
    expect(screen.queryByText(/MX$1,050 */)).toBeDefined();
    // verify that two `course` are rendered on the same page
    expect(screen.getAllByText('Verified Certificate')).toHaveLength(2);

    // verify that Checkout Form fields are present in the DOM
    expect(screen.queryByText('Last Name (required)')).toBeDefined();
    // verify that MonthlySubscriptionNotification is present in the DOM
    expect(screen.queryByText(`You’ll be charged ${subscriptionDetails.price}.00 USD on ${subscriptionDetails.trialEnd} then every 31 days until you cancel your subscription`)).toBeDefined();
  });

  it('should not render the Subscription details and Checkout components', () => {
    render(<SubscriptionPage />);
    act(() => {
      store.dispatch(
        subscriptionDetailsReceived(
          camelCaseObject(Factory.build('subscription', { error_message_id: 'empty_subscription' }, { numProducts: 1 })),
        ),
      );
      store.dispatch(fetchSubscriptionDetails.fulfill());
    });

    // screen.debug();
    // verify that two `course` are rendered on the same page
    expect(screen.queryByText(/Subscription/)).toBeNull();
    expect(screen.queryByText(/Verified Certificate/)).toBeNull();
    expect(screen.queryByText(/MX$1,050 */)).toBeNull();
  });

  it('should render the USD currency if no currency cookie found', () => {
    Cookies.result[process.env.CURRENCY_COOKIE_NAME] = undefined;
    render(<SubscriptionPage />);
    act(() => {
      store.dispatch(
        subscriptionDetailsReceived(
          subscriptionDetails,
        ),
      );
      store.dispatch(fetchSubscriptionDetails.fulfill());
    });

    expect(screen.queryByText(/MX$1,050 */)).toBeNull();
    expect(screen.getByText('$55.00/month USD after 7-day free trial')).toBeDefined();
  });

  it('should render a redirect spinner', () => {
    render(<SubscriptionPage />);
    act(() => {
      store.dispatch(subscriptionDetailsReceived(camelCaseObject(Factory.build(
        'subscription',
        {
          redirect: 'http://localhost/boo',
        },
        { numProducts: 1 },
      ))));
      store.dispatch(fetchSubscriptionDetails.fulfill());
    });
    expect(screen.getByTestId('loading-page')).toBeDefined();
  });
});
