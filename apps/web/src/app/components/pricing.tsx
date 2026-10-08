import { CheckIcon } from '@heroicons/react/20/solid'
import { ProductService } from '@/services/api/shared/productService'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default async function Pricing() {
  const products = await ProductService.findAll()

  return (
    <div id="pricing" className="scroll-mt-24 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-base font-semibold leading-7 text-indigo-600">Pricing</p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Pricing plans for families of&nbsp;all&nbsp;sizes
          </h2>
        </div>
        <div className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          We offer a variety of pricing plans for families of all sizes and interest level. Choose the one that best
          fits your needs.
        </div>
        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-4xl xl:mx-0 xl:max-w-none xl:grid-cols-4">
          {products.map(product => {
            const button = product.lessonType == 'group' ? 'View schedule' : 'Buy now'
            const href = product.lessonType == 'group' ? '#announcement' : '/dashboard/purchase'
            return (
              <div
                key={product.id}
                className={classNames(
                  product.id == '679bc56a56a5a6693dc63d95' ? 'ring-2 ring-indigo-600' : 'ring-1 ring-gray-200',
                  'rounded-3xl p-8',
                )}
              >
                <h3
                  id={product.id}
                  className={classNames(
                    product.id == '679bc56a56a5a6693dc63d95' ? 'text-indigo-600' : 'text-gray-900',
                    'text-lg font-semibold leading-8',
                  )}
                >
                  {product.name}
                </h3>
                <p className="mt-4 text-sm leading-6 text-gray-600">{product.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    ${product.amount / product.credits} / {product.lessonType == 'group' ? 'session' : 'lesson'}
                  </span>
                </p>
                <a
                  href={href}
                  aria-describedby={product.id}
                  className={classNames(
                    product.id == '679bc56a56a5a6693dc63d95'
                      ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500'
                      : 'text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300',
                    'mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
                  )}
                >
                  {button}
                </a>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {product.features.map(feature => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
