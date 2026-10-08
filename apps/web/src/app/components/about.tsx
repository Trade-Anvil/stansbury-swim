import { AcademicCapIcon, CalendarIcon, ShieldCheckIcon, SparklesIcon, UserIcon } from '@heroicons/react/24/outline'
import { YouTubeVideo } from './youtube-video'

const features = [
  {
    name: 'Over 10 years in the community',
    description:
      'Stansbury swim has been teaching kids to swim for over 10 years. We specialize in teaching beginner skills and stroke development to kids ages 3-10.',
    icon: SparklesIcon,
  },
  {
    name: 'Instructors',
    description:
      'Our instructors are passionate about what they do and dedicated to delivering the best results for our students. We have a dynamic group of individuals who are passionate about what they do and dedicated to delivering the best results for our students.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Online Scheduling',
    description:
      'We offer online scheduling for your convenience. You can schedule your lessons online and pay for them online as well.',
    icon: CalendarIcon,
  },
  {
    name: 'Flexible Cancellation Policy',
    description:
      'We have a flexible cancellation policy. If you need to cancel your lesson, you can do so up to 24 hours before your lesson time.',
    icon: ShieldCheckIcon,
  },
]

export default function About() {
  return (
    <div id="about" className="scroll-mt-24 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <p className="text-base font-semibold leading-7 text-indigo-600">Learn faster</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl" id="about-heading">
            Why choose Stansbury Swim?
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We specialize in teaching beginner skills and stroke development to kids ages 3-10.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map(feature => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mx-auto max-w-2xl lg:text-center pt-20">
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">How to get started...</h2>
        </div>
        <div className="mx-auto mt-8 max-w-2xl sm:mt-8 lg:mt-8 lg:max-w-4xl flex justify-center">
          <ol className="space-y-6 text-lg w-full max-w-sm">
            <li className="flex items-center space-x-4 bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors">
              <span
                aria-hidden="true"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold"
              >
                1
              </span>
              <span>Create an account</span>
            </li>
            <li className="flex items-center space-x-4 bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors">
              <span
                aria-hidden="true"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold"
              >
                2
              </span>
              <span>Add students to your profile</span>
            </li>
            <li className="flex items-center space-x-4 bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors">
              <span
                aria-hidden="true"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold"
              >
                3
              </span>
              <span>Purchase credit package</span>
            </li>
            <li className="flex items-center space-x-4 bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors">
              <span
                aria-hidden="true"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold"
              >
                4
              </span>
              <span>Schedule your lessons</span>
            </li>
            <li className="flex items-center space-x-4 bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors">
              <span
                aria-hidden="true"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold"
              >
                5
              </span>
              <span>Watch your little fish take off!</span>
            </li>
          </ol>
        </div>

        <div className="mx-auto max-w-7xl pt-20">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Just watch Brilya go!</h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              We specialize in teaching beginner skills and stroke development to kids ages 3-10.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <YouTubeVideo videoId="P4UDQ3vm10k" title="Brilya's Swim" />
          </div>
        </div>
      </div>
    </div>
  )
}
