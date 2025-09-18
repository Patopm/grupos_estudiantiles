from django.core.management.base import BaseCommand

from apps.notifications.models import EmailTemplate


class Command(BaseCommand):
    help = 'Create default email templates'

    def handle(self, *args, **options):
        templates = [{
            'name':
            'Bienvenida al Sistema',
            'template_type':
            'welcome',
            'subject':
            '¡Bienvenido a Grupos Estudiantiles - Tecmilenio!',
            'html_content':
            '''
                <div class="content">
                    <p>¡Te damos la bienvenida a <strong>Grupos Estudiantiles - Tecmilenio</strong>!</p>
                    
                    <p>Estamos emocionados de tenerte como parte de nuestra comunidad estudiantil. A través de esta plataforma podrás:</p>
                    
                    <ul style="margin: 20px 0; padding-left: 20px;">
                        <li>🎯 <strong>Explorar grupos estudiantiles</strong> que coincidan con tus intereses</li>
                        <li>🤝 <strong>Conectar con otros estudiantes</strong> que comparten tus pasiones</li>
                        <li>📅 <strong>Participar en eventos</strong> organizados por los grupos</li>
                        <li>🌟 <strong>Desarrollar nuevas habilidades</strong> y experiencias</li>
                    </ul>
                    
                    <div class="info-box">
                        <p><strong>💡 Próximos pasos:</strong></p>
                        <ol style="margin: 10px 0; padding-left: 20px;">
                            <li>Completa tu perfil con tu información académica</li>
                            <li>Explora el catálogo de grupos disponibles</li>
                            <li>Solicita ingreso a los grupos que te interesen</li>
                            <li>¡Comienza a participar en eventos!</li>
                        </ol>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{ login_url }}" class="button">Acceder a Mi Dashboard</a>
                    </div>
                    
                    <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. ¡Estamos aquí para apoyarte en tu experiencia universitaria!</p>
                </div>
                ''',
            'text_content':
            '''
                ¡Te damos la bienvenida a Grupos Estudiantiles - Tecmilenio!
                
                Estamos emocionados de tenerte como parte de nuestra comunidad estudiantil. A través de esta plataforma podrás explorar grupos estudiantiles, conectar con otros estudiantes, participar en eventos y desarrollar nuevas habilidades.
                
                Próximos pasos:
                1. Completa tu perfil con tu información académica
                2. Explora el catálogo de grupos disponibles
                3. Solicita ingreso a los grupos que te interesen
                4. ¡Comienza a participar en eventos!
                
                Accede a tu dashboard: {{ login_url }}
                
                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
                '''
        }, {
            'name':
            '2FA Habilitado',
            'template_type':
            '2fa_enabled',
            'subject':
            '🔐 Autenticación de dos factores activada',
            'html_content':
            '''
                <div class="content">
                    <div class="info-box">
                        <p>✅ <strong>Tu cuenta ahora está más segura</strong></p>
                        <p>La autenticación de dos factores (2FA) ha sido activada exitosamente en tu cuenta el {{ enabled_at|date:"d/m/Y" }} a las {{ enabled_at|time:"H:i" }}.</p>
                    </div>
                    
                    <p>Con la 2FA activada, necesitarás:</p>
                    <ol style="margin: 20px 0; padding-left: 20px;">
                        <li>Tu contraseña habitual</li>
                        <li>Un código de 6 dígitos de tu aplicación autenticadora</li>
                    </ol>
                    
                    <div class="warning-box">
                        <p><strong>⚠️ Importante:</strong></p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Guarda los códigos de respaldo en un lugar seguro</li>
                            <li>No compartas tu aplicación autenticadora con nadie</li>
                            <li>Si pierdes acceso a tu dispositivo, contacta al soporte técnico</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{ settings_url }}" class="button">Gestionar Configuración de Seguridad</a>
                    </div>
                    
                    <p>Si no fuiste tú quien activó esta función, <strong>contacta inmediatamente al soporte técnico</strong>.</p>
                </div>
                ''',
            'text_content':
            '''
                Tu cuenta ahora está más segura
                
                La autenticación de dos factores (2FA) ha sido activada exitosamente en tu cuenta el {{ enabled_at|date:"d/m/Y" }} a las {{ enabled_at|time:"H:i" }}.
                
                Con la 2FA activada, necesitarás tu contraseña habitual y un código de 6 dígitos de tu aplicación autenticadora.
                
                Importante:
                - Guarda los códigos de respaldo en un lugar seguro
                - No compartas tu aplicación autenticadora con nadie
                - Si pierdes acceso a tu dispositivo, contacta al soporte técnico
                
                Gestiona tu configuración: {{ settings_url }}
                
                Si no fuiste tú quien activó esta función, contacta inmediatamente al soporte técnico.
                '''
        }, {
            'name':
            '2FA Deshabilitado',
            'template_type':
            '2fa_disabled',
            'subject':
            '🔓 Autenticación de dos factores desactivada',
            'html_content':
            '''
                <div class="content">
                    <div class="warning-box">
                        <p>⚠️ <strong>Tu cuenta es menos segura ahora</strong></p>
                        <p>La autenticación de dos factores (2FA) ha sido desactivada en tu cuenta el {{ disabled_at|date:"d/m/Y" }} a las {{ disabled_at|time:"H:i" }}.</p>
                    </div>
                    
                    <p>Ahora solo necesitarás tu contraseña para acceder a tu cuenta.</p>
                    
                    <div class="info-box">
                        <p><strong>💡 Recomendación:</strong></p>
                        <p>Para mantener tu cuenta segura, te recomendamos:</p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Usar una contraseña fuerte y única</li>
                            <li>Cambiar tu contraseña regularmente</li>
                            <li>Considerar reactivar la 2FA</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{ settings_url }}" class="button">Reactivar 2FA</a>
                        <a href="{{ settings_url }}" class="button button-secondary">Configuración de Seguridad</a>
                    </div>
                    
                    <p>Si no fuiste tú quien desactivó esta función, <strong>contacta inmediatamente al soporte técnico</strong> y cambia tu contraseña.</p>
                </div>
                ''',
            'text_content':
            '''
                Tu cuenta es menos segura ahora
                
                La autenticación de dos factores (2FA) ha sido desactivada en tu cuenta el {{ disabled_at|date:"d/m/Y" }} a las {{ disabled_at|time:"H:i" }}.
                
                Ahora solo necesitarás tu contraseña para acceder a tu cuenta.
                
                Recomendación: Para mantener tu cuenta segura, te recomendamos usar una contraseña fuerte y única, cambiarla regularmente y considerar reactivar la 2FA.
                
                Configuración de seguridad: {{ settings_url }}
                
                Si no fuiste tú quien desactivó esta función, contacta inmediatamente al soporte técnico y cambia tu contraseña.
                '''
        }, {
            'name':
            'Recordatorio de Evento',
            'template_type':
            'event_reminder',
            'subject':
            '🔔 Recordatorio: {{ event.title }} - {{ reminder_time }}',
            'html_content':
            '''
                <div class="content">
                    <p>Te recordamos que tienes un evento próximo en <strong>{{ reminder_time }}</strong>:</p>
                    
                    <div class="event-details">
                        <h3>📅 {{ event.title }}</h3>
                        
                        <div class="event-meta">
                            <div class="event-meta-item">
                                🗓️ <strong>{{ event.start_datetime|date:"l, d de F de Y" }}</strong>
                            </div>
                            <div class="event-meta-item">
                                🕐 <strong>{{ event.start_datetime|time:"H:i" }} - {{ event.end_datetime|time:"H:i" }}</strong>
                            </div>
                            <div class="event-meta-item">
                                📍 <strong>{{ event.location|default:"Por definir" }}</strong>
                            </div>
                        </div>
                        
                        {% if event.description %}
                        <p><strong>Descripción:</strong></p>
                        <p>{{ event.description }}</p>
                        {% endif %}
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{ event_url }}" class="button">Ver Detalles del Evento</a>
                    </div>
                    
                    <p>¡No olvides marcar tu calendario y prepararte para el evento!</p>
                </div>
                ''',
            'text_content':
            '''
                Recordatorio: {{ event.title }} - {{ reminder_time }}
                
                Te recordamos que tienes un evento próximo:
                
                {{ event.title }}
                📅 {{ event.start_datetime|date:"l, d de F de Y" }}
                🕐 {{ event.start_datetime|time:"H:i" }} - {{ event.end_datetime|time:"H:i" }}
                📍 {{ event.location|default:"Por definir" }}
                
                {% if event.description %}Descripción: {{ event.description }}{% endif %}
                
                Ver detalles: {{ event_url }}
                
                ¡No olvides marcar tu calendario y prepararte para el evento!
                '''
        }]

        created_count = 0
        updated_count = 0

        for template_data in templates:
            template, created = EmailTemplate.objects.get_or_create(
                template_type=template_data['template_type'],
                defaults=template_data)

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created template: {template.name}'))
            else:
                # Update existing template
                for key, value in template_data.items():
                    setattr(template, key, value)
                template.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated template: {template.name}'))

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary: {created_count} templates created, {updated_count} templates updated'
            ))
