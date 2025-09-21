import logging
from typing import Optional, Tuple

from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class SMSService:
    """
    SMS service for sending verification codes
    Supports multiple providers with fallback
    """

    def __init__(self):
        self.provider = getattr(settings, "SMS_PROVIDER", "console")
        self.api_key = getattr(settings, "SMS_API_KEY", "")
        self.sender_id = getattr(settings, "SMS_SENDER_ID", "Tecmilenio")

    def send_verification_code(
        self, phone_number: str, code: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Send verification code via SMS

        Args:
            phone_number: Phone number to send to
            code: Verification code to send

        Returns:
            Tuple of (success: bool, error_message: Optional[str])
        """

        # Rate limiting check
        cache_key = f"sms_rate_limit:{phone_number}"
        recent_sends = cache.get(cache_key, 0)

        if recent_sends >= 3:  # Max 3 SMS per hour per number
            return False, "Límite de SMS alcanzado. Intenta de nuevo en una hora."

        try:
            if self.provider == "twilio":
                return self._send_via_twilio(phone_number, code)
            elif self.provider == "aws_sns":
                return self._send_via_aws_sns(phone_number, code)
            elif self.provider == "console":
                return self._send_via_console(phone_number, code)
            else:
                logger.error(f"Unknown SMS provider: {self.provider}")
                return False, "Proveedor de SMS no configurado"

        except Exception as e:
            logger.error(f"Error sending SMS to {phone_number}: {str(e)}")
            return False, "Error interno del servicio SMS"

    def _send_via_twilio(
        self, phone_number: str, code: str
    ) -> Tuple[bool, Optional[str]]:
        """Send SMS via Twilio"""
        try:
            from twilio.rest import Client

            account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "")
            auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "")
            from_number = getattr(settings, "TWILIO_PHONE_NUMBER", "")

            if not all([account_sid, auth_token, from_number]):
                return False, "Configuración de Twilio incompleta"

            client = Client(account_sid, auth_token)

            message_body = f"Tu código de verificación para Grupos Estudiantiles es: {code}. Válido por 10 minutos."

            message = client.messages.create(
                body=message_body, from_=from_number, to=phone_number
            )

            if message.sid:
                self._update_rate_limit(phone_number)
                logger.info(f"SMS sent successfully via Twilio to {phone_number}")
                return True, None
            else:
                return False, "Error enviando SMS via Twilio"

        except ImportError:
            logger.error("Twilio library not installed")
            return False, "Librería de Twilio no instalada"
        except Exception as e:
            logger.error(f"Twilio SMS error: {str(e)}")
            return False, f"Error de Twilio: {str(e)}"

    def _send_via_aws_sns(
        self, phone_number: str, code: str
    ) -> Tuple[bool, Optional[str]]:
        """Send SMS via AWS SNS"""
        try:
            import boto3
            from botocore.exceptions import ClientError

            aws_access_key = getattr(settings, "AWS_ACCESS_KEY_ID", "")
            aws_secret_key = getattr(settings, "AWS_SECRET_ACCESS_KEY", "")
            aws_region = getattr(settings, "AWS_REGION", "us-east-1")

            if not all([aws_access_key, aws_secret_key]):
                return False, "Configuración de AWS incompleta"

            sns_client = boto3.client(
                "sns",
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=aws_region,
            )

            message_body = f"Tu código de verificación para Grupos Estudiantiles es: {code}. Válido por 10 minutos."

            response = sns_client.publish(
                PhoneNumber=phone_number,
                Message=message_body,
                MessageAttributes={
                    "AWS.SNS.SMS.SenderID": {
                        "DataType": "String",
                        "StringValue": self.sender_id,
                    },
                    "AWS.SNS.SMS.SMSType": {
                        "DataType": "String",
                        "StringValue": "Transactional",
                    },
                },
            )

            if response.get("MessageId"):
                self._update_rate_limit(phone_number)
                logger.info(f"SMS sent successfully via AWS SNS to {phone_number}")
                return True, None
            else:
                return False, "Error enviando SMS via AWS SNS"

        except ImportError:
            logger.error("Boto3 library not installed")
            return False, "Librería de AWS no instalada"
        except ClientError as e:
            logger.error(f"AWS SNS error: {str(e)}")
            return False, f"Error de AWS SNS: {str(e)}"
        except Exception as e:
            logger.error(f"AWS SNS SMS error: {str(e)}")
            return False, f"Error de AWS SNS: {str(e)}"

    def _send_via_console(
        self, phone_number: str, code: str
    ) -> Tuple[bool, Optional[str]]:
        """Send SMS via console (development/testing)"""
        message = f"""
        ========================================
        SMS VERIFICATION CODE
        ========================================
        To: {phone_number}
        Code: {code}
        Message: Tu código de verificación para Grupos Estudiantiles es: {code}. Válido por 10 minutos.
        ========================================
        """

        print(message)
        logger.info(f"SMS sent via console to {phone_number}: {code}")

        self._update_rate_limit(phone_number)
        return True, None

    def _update_rate_limit(self, phone_number: str):
        """Update rate limiting counter"""
        cache_key = f"sms_rate_limit:{phone_number}"
        current_count = cache.get(cache_key, 0)
        cache.set(cache_key, current_count + 1, 3600)  # 1 hour timeout

    def check_rate_limit(self, phone_number: str) -> Tuple[bool, int]:
        """
        Check if phone number has exceeded rate limit

        Returns:
            Tuple of (can_send: bool, remaining_sends: int)
        """
        cache_key = f"sms_rate_limit:{phone_number}"
        current_count = cache.get(cache_key, 0)
        max_sends = 3

        can_send = current_count < max_sends
        remaining = max(0, max_sends - current_count)

        return can_send, remaining


# Global SMS service instance
sms_service = SMSService()


def send_phone_verification_sms(
    phone_number: str, code: str
) -> Tuple[bool, Optional[str]]:
    """
    Convenience function to send phone verification SMS

    Args:
        phone_number: Phone number to send to
        code: Verification code to send

    Returns:
        Tuple of (success: bool, error_message: Optional[str])
    """
    return sms_service.send_verification_code(phone_number, code)


def check_sms_rate_limit(phone_number: str) -> Tuple[bool, int]:
    """
    Convenience function to check SMS rate limit

    Args:
        phone_number: Phone number to check

    Returns:
        Tuple of (can_send: bool, remaining_sends: int)
    """
    return sms_service.check_rate_limit(phone_number)
