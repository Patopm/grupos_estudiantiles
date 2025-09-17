import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebook as faFacebookBrand,
  faTwitter as faTwitterBrand,
  faInstagram as faInstagramBrand,
  faLinkedin as faLinkedinBrand,
} from '@fortawesome/free-brands-svg-icons';

export default function Footer() {
  return (
    <footer className='bg-primary text-primary-foreground'>
      <div className='max-w-7xl mx-auto px-6 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Brand Section */}
          <div className='col-span-1 md:col-span-2'>
            <h3 className='text-2xl font-bold mb-4'>Grupos Estudiantiles</h3>
            <p className='text-primary-foreground/80 mb-4 max-w-md'>
              Plataforma oficial de Tecmilenio para la gestión integral de
              grupos estudiantiles. Conecta, participa y crece junto a tu
              comunidad universitaria.
            </p>
            <div className='flex space-x-4'>
              <a
                href='https://facebook.com/tecmilenio'
                className='text-primary-foreground/60 hover:text-primary-foreground transition-colors'
                aria-label='Facebook'
              >
                <FontAwesomeIcon icon={faFacebookBrand} className='w-5 h-5' />
              </a>
              <a
                href='https://twitter.com/tecmilenio'
                className='text-primary-foreground/60 hover:text-primary-foreground transition-colors'
                aria-label='Twitter'
              >
                <FontAwesomeIcon icon={faTwitterBrand} className='w-5 h-5' />
              </a>
              <a
                href='https://instagram.com/tecmilenio'
                className='text-primary-foreground/60 hover:text-primary-foreground transition-colors'
                aria-label='Instagram'
              >
                <FontAwesomeIcon icon={faInstagramBrand} className='w-5 h-5' />
              </a>
              <a
                href='https://linkedin.com/school/tecmilenio'
                className='text-primary-foreground/60 hover:text-primary-foreground transition-colors'
                aria-label='LinkedIn'
              >
                <FontAwesomeIcon icon={faLinkedinBrand} className='w-5 h-5' />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='text-lg font-semibold mb-4'>Enlaces Rápidos</h4>
            <ul className='space-y-2 text-primary-foreground/80'>
              <li>
                <Link
                  href='/groups'
                  className='hover:text-primary-foreground transition-colors'
                >
                  Explorar Grupos
                </Link>
              </li>
              <li>
                <Link
                  href='/events'
                  className='hover:text-primary-foreground transition-colors'
                >
                  Eventos
                </Link>
              </li>
              <li>
                <Link
                  href='/dashboard'
                  className='hover:text-primary-foreground transition-colors'
                >
                  Mi Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href='/help'
                  className='hover:text-primary-foreground transition-colors'
                >
                  Ayuda
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className='text-lg font-semibold mb-4'>Contacto</h4>
            <ul className='space-y-2 text-primary-foreground/80 text-sm'>
              <li className='flex items-center gap-2'>
                <FontAwesomeIcon icon={faEnvelope} className='w-4 h-4' />
                <span>grupos@tecmilenio.mx</span>
              </li>
              <li className='flex items-center gap-2'>
                <FontAwesomeIcon icon={faPhone} className='w-4 h-4' />
                <span>800-TECMILENIO</span>
              </li>
              <li className='flex items-start gap-2'>
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  className='w-4 h-4 mt-0.5'
                />
                <span>
                  Campus Tecmilenio
                  <br />
                  México
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className='border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/60'>
          <p>
            &copy; 2025 Universidad Tecmilenio. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
