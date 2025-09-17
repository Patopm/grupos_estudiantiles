import FeatureCard from './FeatureCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faUsers,
  faChartBar,
} from '@fortawesome/free-solid-svg-icons';

export default function FeaturesSection() {
  return (
    <section className='px-6 py-16 bg-background'>
      <div className='max-w-7xl mx-auto'>
        <h2 className='text-3xl font-bold text-center mb-12'>
          Why Choose EventHub?
        </h2>
        <div className='grid md:grid-cols-3 gap-8'>
          <FeatureCard
            icon={
              <FontAwesomeIcon
                icon={faCalendarAlt}
                className='w-8 h-8 text-primary'
              />
            }
            title='Easy Event Creation'
            description='Create and customize events in minutes with our intuitive interface.'
          />
          <FeatureCard
            icon={
              <FontAwesomeIcon
                icon={faUsers}
                className='w-8 h-8 text-primary'
              />
            }
            title='Student Management'
            description='Manage student registrations and track attendance seamlessly.'
          />
          <FeatureCard
            icon={
              <FontAwesomeIcon
                icon={faChartBar}
                className='w-8 h-8 text-primary'
              />
            }
            title='Analytics & Insights'
            description='Get detailed insights about your events and attendee engagement.'
          />
        </div>
      </div>
    </section>
  );
}
