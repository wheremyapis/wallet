import { test, expect } from '@playwright/test'
import { privateKey, privateKeyAddress } from '../utils/test-inputs'
import { fillPrivateKeyWithoutPassword } from '../utils/fillPrivateKey'
import { warnSlowApi } from '../utils/warnSlowApi'
import { mockApi } from '../utils/mockApi'
import { expectNoErrorsInConsole } from '../utils/expectNoErrorsInConsole'

test.beforeEach(async ({ page }) => {
  await warnSlowApi(page)
  await mockApi(page, 500000000000)
  await expectNoErrorsInConsole(page)

  await page.goto('/open-wallet/private-key')
  await fillPrivateKeyWithoutPassword(page, {
    privateKey: privateKey,
    privateKeyAddress: privateKeyAddress,
    persistenceCheckboxChecked: false,
    persistenceCheckboxDisabled: false,
  })
  await expect(page.getByTestId('account-selector')).toBeVisible()
  await page.getByRole('link', { name: 'Buy' }).click()
  await expect(page.getByText('Buy ROSE')).toBeVisible()
})

test.describe('Fiat on-ramp', () => {
  test('Content-Security-Policy should allow embedded Transak widget', async ({ page, baseURL }) => {
    expect(baseURL).toBe('http://localhost:5000')
    expect((await page.request.head('/')).headers()).toHaveProperty('content-security-policy')
    await page
      .getByText(
        'I understand that I’m using a third-party solution and Oasis* does not carry any responsibility over the usage of this solution.',
      )
      .click()
    await expect(page.frameLocator('iframe')!.getByAltText('Powered by Transak')).toBeVisible()
    await page.frameLocator('iframe')!.getByText('Buy now').click()
    await expect(page.frameLocator('iframe')!.getByText('Please Enter Your Email')).toBeVisible()
  })

  test('Content-Security-Policy should also allow Transak staging iframe', async ({ page, baseURL }) => {
    expect(baseURL).toBe('http://localhost:5000')
    expect((await page.request.head('/')).headers()).toHaveProperty('content-security-policy')
    await page.route('https://global.transak.com/*', route =>
      route.fulfill({
        status: 301,
        headers: {
          Location: 'https://global-stg.transak.com/',
        },
      }),
    )

    await page
      .getByText(
        'I understand that I’m using a third-party solution and Oasis* does not carry any responsibility over the usage of this solution.',
      )
      .click()
  })

  test('Content-Security-Policy should block unknown iframe and fail', async ({ page, baseURL }) => {
    test.fail()
    expect(baseURL).toBe('http://localhost:5000')
    expect((await page.request.head('/')).headers()).toHaveProperty('content-security-policy')
    await page.route('https://global.transak.com/*', route =>
      route.fulfill({
        status: 301,
        headers: {
          Location: 'https://phishing-transak.com/',
        },
      }),
    )
    await page.route('https://phishing-transak.com/', route => route.fulfill({ body: `phishing` }))

    await page
      .getByText(
        'I understand that I’m using a third-party solution and Oasis* does not carry any responsibility over the usage of this solution.',
      )
      .click()
  })

  test('Sandbox should block top-navigation from iframe and fail', async ({ page, baseURL }) => {
    test.fail()
    expect(baseURL).toBe('http://localhost:5000')
    expect((await page.request.head('/')).headers()).toHaveProperty('content-security-policy')
    await page.route('https://global.transak.com/*', route =>
      route.fulfill({
        body: `<script>window.top.location = 'https://phishing-wallet.com/';</script>`,
      }),
    )
    await page.route('https://phishing-wallet.com/', route => route.fulfill({ body: `phishing` }))

    await page
      .getByText(
        'I understand that I’m using a third-party solution and Oasis* does not carry any responsibility over the usage of this solution.',
      )
      .click()
    await expect(page).toHaveURL('https://phishing-wallet.com/')
  })
})
