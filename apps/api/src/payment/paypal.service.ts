import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import checkoutNodeJssdk from '@paypal/checkout-server-sdk'
import { PayPalHttpClient } from '@paypal/checkout-server-sdk/lib/core/lib'
import { OrdersCaptureRequest, OrdersCreateRequest, Payer } from '@paypal/checkout-server-sdk/lib/orders/lib'
import { AmountBreakdown } from '@paypal/checkout-server-sdk/lib/payments/lib'
import { ProductService } from 'product/product.service'
import { ConfigEnum } from 'shared/config.enum'
import { User } from 'user/user'

@Injectable()
export class PaypalService {
  client: () => PayPalHttpClient
  constructor(
    public readonly configService: ConfigService,
    private readonly productService: ProductService,
  ) {
    const configureEnvironment = () => {
      const clientId = configService.get(ConfigEnum.PaypalClientId)
      const clientSecret = configService.get(ConfigEnum.PaypalClientSecret)

      const environment = this.configService.get(ConfigEnum.PaypalEnvironment)

      return environment === 'production'
        ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
        : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret)
    }

    this.client = () => {
      return new checkoutNodeJssdk.core.PayPalHttpClient(configureEnvironment())
    }
  }

  async createOrder(productId: string, quantity = 1, user: User) {
    const product = await this.productService.findOne(productId)

    const PaypalClient = this.client()
    //This code is lifted from https://github.com/paypal/Checkout-NodeJS-SDK
    const strippedPhone = user.phone.replace(/\D/g, '')
    const request = new OrdersCreateRequest()
    request.headers['prefer'] = 'return=representation'
    const payer: Payer = {
      name: {
        given_name: user.firstName,
        surname: user.lastName,
      },
      email_address: user.email,
      address: {
        country_code: 'US',
      },
      phone: {
        phone_type: 'MOBILE',
        phone_number: {
          national_number: strippedPhone,
        },
      },
    } as Payer

    const totalAmount = product.amount * quantity

    request.requestBody({
      intent: 'CAPTURE',
      payer,
      purchase_units: [
        {
          custom_id: product.id,
          description: product.description,
          amount: {
            currency_code: 'USD',
            value: totalAmount.toString(),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: totalAmount.toString(),
              },
            } as AmountBreakdown,
          },
          items: [
            {
              name: product.name,
              category: 'PHYSICAL_GOODS',
              unit_amount: {
                currency_code: 'USD',
                value: (totalAmount / quantity).toString(),
              },
              quantity: quantity.toString(),
            },
          ],
        },
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING',
      },
    })
    const response = await PaypalClient.execute(request)

    if (response.statusCode !== 201) {
      throw new Error('Failed to create order')
    }
    return response.result
  }

  async captureOrder(orderId: string) {
    const PaypalClient = this.client()
    const request = new OrdersCaptureRequest(orderId)
    request.requestBody({} as any)
    const response = await PaypalClient.execute(request)

    if (response.statusCode !== 201) {
      throw new Error('Failed to capture order')
    }

    return response.result
  }
}
